/*
The type 2017a password is calculated like so (pseudo-code):

	stretchedmaster = StretchMasterPassword(yourMasterPassword, yourEmailAddress)
	
	sitekey = MakeSiteKey(stretchedmaster, 'example.com', 0)  //revision 0
	
	cardCoordinate1, cardCoordinate2 = MakeSiteCoordinates(sitekey, 2)
	
	eightCharsFromCard = youGoLookup(cardCoordinate1, cardCoordinate2)

	finalSeed = StretchSiteCardMix(MixSiteAndCard(sitekey, eightCharsFromCard))

	finalPassword = MakeFriendlyPassword12a(finalSeed)

This construction achieves these goals:

1. If your master password is compromised you're safe because they don't have your card.
2. If your card is compromised you're safe because they don't know the master password.
3. Master password is very expensive to brute force (effectively bcrypt 15).
4. The eight card characters are very expensive to brute force (effectively bcrypt 15).
5. A verifier hash for the stretched master password can be stored to check for typos.
6. Uses only 3 cryptograhic primitives: SHA-256, HMAC and bcrypt.
7. Good performance when implemented in JavaScript.
8. In the future, an embedded device with a secure element could store the stretched master
   password and the entire card.  These secrets would never leave secure memory.  The
   device can compute everything up to StretchSiteCardMix().

The bcrypt algorithm is used as the slow hash for the two key stretching steps.  bcrypt was chosen because
it has a proven track record.  The stretching uses 4 invokations of bcrypt with cost 13.  Each invokation
runs in a separate thread.  Since many modern computers have 4 cores this means we are doing 4X more work
in the same amount of time.  This yields an effective bcrypt cost of 15 (each increment of cost doubles the
calculation time).  For perspective, the Ashley Madison leak of 36 million bcrypt 12 hashes has mostly stymied
crackers. (https://arstechnica.com/security/2015/08/cracking-all-hacked-ashley-madison-passwords-could-take-a-lifetime/)

Argon2 would have been even better but it requires a lot of 64bit integer math
and thread synchronization, neither of which work well in JavaScript.
*/
package type2017a

import (
	"errors"
	"strings"
	"crypto/sha256"
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"github.com/cruxic/calcpass/golang/calcpass/card"
	"github.com/cruxic/calcpass/golang/calcpass/parallel_bcrypt"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"bytes"
	"strconv"
)

const bcryptCost_2017a = 13

const cardAlphabet = "abcdefghijklmnopqrstuvwxyz"
const typeA_xNames = "ABCDEFGHJKLMNPQRSTUVWX"  //skip I and O to avoid ambiguity when rendered with certain fonts
const typeAcardWidth = 22
const typeAcardHeight = 15


func isSaneEmail(s string) bool {
	//a@b.c
	return len(s) >= 4 && strings.Contains(s, "@") && strings.Contains(s, ".")
}

//32 byte hash of your master password
type StretchedMaster []byte

//32 byte hash of website or program name for which you need a password and the revision number
// mixed with StretchedMaster
type SiteKey []byte

//32 byte hash of SiteKey and characters from the card
type SiteCardMix []byte

//32 byte hash to be used to generate a human readable password
type PasswordSeed []byte



/**Hash the given password using 4 bcrypt threads with cost 13.

userEmail is used to salt the hash.  Since email addresses are globally
unique this will make precomputation pointless.
*/
func StretchMasterPassword(plaintextPassword []byte, userEmail string) (StretchedMaster, error) {
	if len(plaintextPassword) < 8 {
		return nil, errors.New("password too short")
	}

	userEmail = strings.TrimSpace(userEmail)
	if !isSaneEmail(userEmail) {
		return nil, errors.New("Invalid email address")
	}

	fullSalt := "calcpass2017a " + userEmail

	//bcrypt needs exactly 16 bytes
	sha := sha256.New()
	sha.Write([]byte(fullSalt))
	salt16 := sha.Sum(nil)[0:parallel_bcrypt.BcryptSaltLen]

	hash, err := parallel_bcrypt.Hash(4, plaintextPassword, salt16, bcryptCost_2017a)
	if err != nil {
		return nil, err
	}
	if len(hash) != 32 {
		panic("parallel_bcrypt returned wrong size")
	}

	return StretchedMaster(hash), nil
}

func CreateStretchedMasterVerifier(stretchedMaster StretchedMaster) (string, error) {
	//Create 16 bytes of secure-random salt
	salt := make([]byte, 16, 64)
	_, err := rand.Read(salt)
	if err != nil {
		return "", err
	}

	hash := util.HmacSha256([]byte(stretchedMaster), salt)

	raw := append(salt, hash...)

	//checksum to detect (accidental) corruption
	chksum := sha256.Sum256(raw)
	raw = append(raw, chksum[0:4]...)

	return base64.StdEncoding.EncodeToString(raw), nil
}

/**Verify that the master password was entered correctly.*/
func VerifyStretchedMasterPassword(stretchedMaster StretchedMaster, verifier string) (bool, error) {
	raw, err := base64.StdEncoding.DecodeString(verifier)
	if err != nil {
		return false, errors.New("verifier is not valid base64")
	}

	if len(raw) != 16+32+4 {
		return false, errors.New("verifier is wrong length")
	}

	salt := raw[0:16]
	hash1 := raw[16:48]
	chksum1 := raw[48:]

	//check for accidental corruption
	chksum2 := sha256.Sum256(raw[0:48])
	if !bytes.Equal(chksum1, chksum2[0:4]) {
		return false, errors.New("verifier is corrupt")
	}
	
	hash2 := util.HmacSha256(stretchedMaster, salt)
	
	return subtle.ConstantTimeCompare(hash1, hash2) == 1, nil
}

func MakeSiteKey(stretchedMaster StretchedMaster, websiteName string, revision int) (SiteKey, error) {
	if len(websiteName) < 2 {
		return nil, errors.New("website name too short")
	}
	
	if revision < 0 {
		return nil, errors.New("revision cannot be negative")
	}

	//Ensure websiteName is case insensitive
	// (eg "CalcPass.com" should be hash the same as "calcpass.com")
	websiteName = strings.TrimSpace(strings.ToLower(websiteName))

	message := websiteName + " " + strconv.Itoa(revision)
	hash := util.HmacSha256([]byte(stretchedMaster), []byte(message))

	return SiteKey(hash), nil
}

func typeA_yNameFunc(index int) string {
	return strconv.Itoa(index + 1)	
}

func typeA_xNameFunc(index int) string {
	if index >= len(typeA_xNames) {
		panic("index out of range")
	}
	
	return typeA_xNames[index:index+1]
}


func MakeSiteCoordinates(siteKey SiteKey, count int) ([]card.Coord, error) {
	if count < 1 || count > 100 {
		return nil, errors.New("invalid coordinate count")
	}

	return card.MakeCoordinates([]byte(siteKey), count, typeAcardWidth, typeAcardHeight,
		typeA_xNameFunc, typeA_yNameFunc)
}

/**Mix SiteKey and card characters using HmacSha256.*/
func MixSiteAndCard(siteKey SiteKey, charactersFromCard string) (SiteCardMix, error) {
	//2017a cards are all lower case
	charactersFromCard = strings.TrimSpace(strings.ToLower(charactersFromCard))

	if len(charactersFromCard) < 8 {
		return nil, errors.New("Too few characters from card")
	}

	//verify a-z
	for _, c := range charactersFromCard {
		if c < 'a' || c > 'z' {
			return nil, errors.New("charactersFromCard must be a through z")
		}
	}

	hash := util.HmacSha256([]byte(siteKey), []byte(charactersFromCard))
	return SiteCardMix(hash), nil
}

/**If your master password is compromised the adversary still has
to use brute force to guess the characters from the card (208 billion possibilities).
This step slows such guessing attempts.*/
func StretchSiteCardMix(siteCardMix SiteCardMix) PasswordSeed {
	//split in half for key & salt
	raw := []byte(siteCardMix)
	key := raw[0:16]
	salt := raw[16:]
	
	hash, err := parallel_bcrypt.Hash(4, key, salt, bcryptCost_2017a)
	if err != nil {
		//will not happen because input sizes are strictly controlled
		panic(err)
	}

	return PasswordSeed(hash)
}

/**Create a human readable password from a 32 byte seed.
The password should minimize the hassle of typing it.
Even if you normally use the calcpass browser plugin,
sooner or later you'll find yourself entering a password
manually on your smartphone or TV.

We should also minimize chances that an archaic website with
stupid password limitations will reject the password.

Passwords from this function will be:
  * 12 characters long.
  * Start with a capital A-Z.
  * Followed by ten lowercase a-z.
  * End with 0-9.

For example:  Szbhgdixtgw9

If your are being targeted and your adversary knows that you
use calcpass then he must make 36 quadrillion guesses (10^16).
This is not viable for an online (over a network) attack.

For comparison, an 8 character password using an alphabet of 72
characters (mixed case and ten specials), has a strength of only 10^14
and is much harder to type.

Because the characters are random, these passwords will likely resist
the most common types of offline cracking attempts: dictionary and "hybrid".

These passwords are NOT long enough to withstand a targeted offline
cracking attempt.  Therefore they should not be used for encryption
keys unless a slow KDF function is also used.

Finally, keep in mind that passwords from this function are only
as strong as the seed used.  For example, if the seed was created
as the hash of a 4 digit number that means there are only 10,000 possible
seeds.  If the attacker knows this then your password is easily guessable!

For some interesting research regarding online vs offline password
strength please read:

"An Administrator’s Guide to Internet Password Research"
Dinei Florêncio and Cormac Herley, Microsoft Research; Paul C. van Oorschot, Carleton University
https://www.usenix.org/conference/lisa14/conference-program/presentation/florencio
*/
func MakeFriendlyPassword12a(seed PasswordSeed) (string, error) {
	rng := util.NewHmacCounterByteSource([]byte(seed), 128)

	chars := make([]byte, 12)

	const ascii_a = 0x61
	const ascii_A = 0x41
	const ascii_0 = 0x30

	//Select 11 a-z characters
	for i := 0; i < 11; i++ {
		b, err := util.UnbiasedSmallInt(rng, 26)
		if err != nil {
			//HMAC-DRBG exhausted - extremely unlikely
			return "", err
		}

		//Capitalize the first char
		if i == 0 {
			chars[i] = byte(ascii_A + b)
		} else {
			chars[i] = byte(ascii_a + b)
		}
	}

	//Select 0-9
	b, err := util.UnbiasedSmallInt(rng, 10)
	if err != nil {
		return "", err
	}
	chars[11] = byte(b + ascii_0)

	s := string(chars)
	util.Erase(chars)
	
	return s, nil
}
