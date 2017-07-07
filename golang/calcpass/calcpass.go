package calcpass

import (
	"github.com/cruxic/go-hmac-drbg/hmacdrbg"
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"github.com/cruxic/calcpass/golang/calcpass/parallel_bcrypt"
	"errors"
	"fmt"
	"strings"
)

/**A deterministic byteSource from hmacdrbg.
It uses HMAC/SHA-256 to generate the pseudo-random bytes
from a 256bit seed.
*/
type hmacDrbgByteSource struct {
	drbg *hmacdrbg.HmacDrbgReader
}

func newHmacDrbgByteSource(seed32 []byte) *hmacDrbgByteSource {
	if len(seed32) != 32 {
		panic("bad seed length")
	}
	
	return &hmacDrbgByteSource {
		drbg: hmacdrbg.NewHmacDrbgReader(hmacdrbg.NewHmacDrbg(128, seed32, nil)),
	}
}

func (self *hmacDrbgByteSource) NextByte() (byte, error) {
	one := []byte{0}
	_, err := self.drbg.Read(one)
	if err != nil {
		return 0, err
	}

	return one[0], nil
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
use calcpass then he must make 10^16 guesses (~36 quadrillion).
This is obviously not viable for an online (over a network) attack.

Because the characters are random, these passwords will likely resist
the most common types of offline cracking attempts: dictionary and "hybrid".

These passwords are NOT long enough to withstand a targeted offline
cracking attempt.  Therefore they should not be used for encryption
keys unless a slow KDF function is also used.

Finally, keep in mind that passwords from this function are only
as strong as the seed used.  For example, if the seed was created
as the hash of a 4 digit number that means there's only 10,000 possible
passwords.  If the attacker knows this then your password is
easily guessable!

For some interesting research regarding online vs offline password
strength please read:

"An Administrator’s Guide to Internet Password Research"
Dinei Florêncio and Cormac Herley, Microsoft Research; Paul C. van Oorschot, Carleton University
https://www.usenix.org/conference/lisa14/conference-program/presentation/florencio
*/
func MakeFriendlyPassword12a(seed32 []byte) (string, error) {
	if len(seed32) != 32 {
		return "", errors.New("seed must be 32 bytes")
	}

	rng := newHmacDrbgByteSource(seed32)

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

		//Capitalized the first
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

/**Mix the card lock password with the website name, card-type, and desired revision number.
websiteName and cardType must be non-empty and are forced to lower case.  Revision must be >= 0.
The function will panic if any parameter is invalid.
*/
/*
func GetKeyForWebsite(hashedCardLockPassword []byte, websiteName, cardType string, revision int) []byte {
	//sanity
	if len(hashedCardLockPassword) != sha256.Size ||
		len(websiteName) == 0 ||
		len(cardType) == 0 ||
		revision < 0 {
		panic("illegal argument")
	}
	msg := strings.ToLower(cardType) + strconv.Itoa(revision) + strings.ToLower(websiteName)

	return hmacSha256(hashedCardLockPassword, []byte(msg))
}*/

func CalcPass_2017a(plainCardLockPassword, plainCharactersFromCard []byte, websiteName string, revision int) (string, error) {
	if len(plainCharactersFromCard) < 8 {
		return "", errors.New("Must have at least 8 characters from the card")
	}
	if len(plainCardLockPassword) < 8 {
		return "", errors.New("Card lock password too short")
	}
	if len(websiteName) < 2 {
		return "", errors.New("website name too short")
	}
	if revision < 0 {
		return "", errors.New("revision cannot be negative")
	}

	//Caller must ensure websiteName is lower case
	// (eg "CalcPass.com" should be hash the same as "calcpass.com")
	if websiteName != strings.ToLower(websiteName) {
		return "", errors.New("website or program name must be lower case")
	}

	message := fmt.Sprintf("%s %d", websiteName, revision)
	salt := util.HmacSha256(plainCharactersFromCard, []byte(message))

	const bcryptCost = 13
	hash, err := parallel_bcrypt.Hash(4, plainCardLockPassword, salt[0:parallel_bcrypt.BcryptSaltLen], bcryptCost)

	util.Erase(salt)
	salt = nil

	if err != nil {
		return "", err
	}

	//convert hash to friendly password
	return MakeFriendlyPassword12a(hash)
}

/*
func concatAll(buffers [][]byte) []byte {
	all := make([]byte, 0, len(buffers[0]) + len(buffers))
	for i := range buffers {
		all = append(all, buffers[i]...)
	}
	return all
}
*/


