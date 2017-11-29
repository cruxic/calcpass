package calcpass

import (
	"errors"
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"fmt"
)

type PassFmt byte

//Password output formats
const (
	PassFmt_Friendly9 PassFmt = 9
	PassFmt_Friendly12 PassFmt = 12
)


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
func MakeFriendlyPassword(hash32 []byte, outputLength int) (string, error) {
	if outputLength < 9 || outputLength > 64 {
		return "", errors.New("MakeFriendlyPassword: outputLength out of range")
	}

	rng := util.NewHmacCounterByteSource(hash32, 128)

	chars := make([]byte, outputLength)

	const ascii_a = 0x61
	const ascii_A = 0x41
	const ascii_0 = 0x30

	//Select outputLength minus 1 a-z characters
	for i := 0; i < outputLength-1; i++ {
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
	chars[outputLength-1] = byte(b + ascii_0)

	s := string(chars)
	util.Erase(chars)
	
	return s, nil
}


func MakePassword(hash32 []byte, passFormat PassFmt) (string, error) {
	switch passFormat {
		case PassFmt_Friendly9:
			fallthrough
		case PassFmt_Friendly12:
			outputLen := int(passFormat)
			return MakeFriendlyPassword(hash32, outputLen)
		default:
			return "", errors.New(fmt.Sprintf("Unsupported PassFmt %d", int(passFormat)))
	}
}
