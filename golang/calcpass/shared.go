package calcpass

import (
	"golang.org/x/crypto/bcrypt"
	"fmt"
)

/**
Convert the plain-text card lock password into a 32-byte key.
This key derivation is intentinally slow (over 1 second on most PCs)
to discourage brute-force guessing.

Because this hash is unsalted, DO NOT persist the resulting key anywhere.
If you wish to persist it use another (faster) KDF to create an
encryption key and use that to encrypt the output of this function.  It
should be stored WITHOUT an oracle which tells the attacker if the decryption
succeeded or not, otherwise it completely circumvents the guessing resistance
of this function.  The user must validate correct decryption with their "check word".
*/
func HashCardLockPassword(plaintext string) []byte {
	return nil

}



func What(i int) int {
	res, _ := bcrypt.GenerateFromPasswordAndSalt([]byte("helloworld"), []byte("1234567890123456"), 5)	
	fmt.Println(string(res))
	return i + 1;
}
