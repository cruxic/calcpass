/**Run bcrypt password hash in parallel threads and combine the results.
Four threads is a good choice.  Since most modern computers and
 mobile devices have 4 core processors the hash completes in about
 the same amount of time as a single bcrypt, however it makes
 cracking attempts 4X more costly.
*/
package parallel_bcrypt

import (
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"golang.org/x/crypto/bcrypt"
	"crypto/sha256"
	"errors"
	"strconv"
)

//Salt must be exactly this number of bytes
const BcryptSaltLen = 16

//The number of bytes returned by Hash()
const OutputSize = 32

type thread_result struct {
	threadIndex int	
	bcryptHash []byte
	err error
}

/**Hash given password with N threads (1-32).  There is no length limit on the password
because it is first hashed with sha256 before it goes into bcrypt.
The output hash is always 32 bytes.
*/
func Hash(nThreads int, plaintextPassword []byte, salt []byte, cost int) ([]byte, error) {
	if len(plaintextPassword) == 0 {
		return nil, errors.New("empty password or salt");
	}

	if len(salt) != BcryptSaltLen {
		return nil, errors.New("bcrypt salt must be exactly " + strconv.Itoa(BcryptSaltLen) + " bytes")
	}

	if nThreads < 0 || nThreads > 32 {
		return nil, errors.New("nThreads out of range")
	}


	//
	// Spawn the threads
	
	resultChan := make(chan *thread_result, nThreads)
	for i := 0; i < nThreads; i++ {
		go bcryptThread(plaintextPassword, salt, cost, i, resultChan)
	}

	//
	// Wait for threads to finish
	
	bcryptHashes := make([][]byte, nThreads)
	for _ = range bcryptHashes {
		res := <-resultChan
		if res.err != nil {
			//unlikely (bad cost parameter?)
			return nil, res.err
		}
		
		//sanity
		if bcryptHashes[res.threadIndex] != nil {
			panic("duplicate thread index")
		}
		
		bcryptHashes[res.threadIndex] = res.bcryptHash
	}
	
	//Combine all the base64 bcrypt hashes with sha256
	var sha = sha256.New()
	for i := range bcryptHashes {
		sha.Write(bcryptHashes[i])
		util.Erase(bcryptHashes[i])
	}
	
	finalHash := sha.Sum(nil)
	sha.Reset()
	
	return finalHash, nil
}

//Same as hex.EncodeToString() but it returns a []byte instead of string so
// that we can later erase it.
func bytesToHex(data []byte) []byte {
	//ASCII 0-9 a-f
	chars := [16]byte{0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x61,0x62,0x63,0x64,0x65,0x66}

	res := make([]byte, len(data) * 2)
	j := 0
	for _, b := range data {
		res[j] = chars[b >> 4]
		j++
		res[j] = chars[b & 0x0f]
		j++
	}

	return res
}


func bcryptThread(plaintextPassword, salt []byte, cost, threadIndex int, result chan *thread_result) {

	//Derive a distinct password for this thread to work on:
	//  eg: sha256(plaintextPassword + 0x01)
	var sha = sha256.New()
	sha.Write(plaintextPassword)
	sha.Write([]byte{byte(threadIndex + 1)})
	threadPassword := sha.Sum(nil)
	sha.Reset()

	//Some bcrypt implementations are broken (eg PHP) because they truncate
	// the password at the first null byte!  Therefore I'll pass 64 hex characters.
	//(bcrypt can handle up to 72 bytes)
	hexPass := bytesToHex(threadPassword)

	var tr thread_result
	tr.threadIndex = threadIndex
	tr.bcryptHash, tr.err = bcrypt.GenerateFromPasswordAndSalt(hexPass, salt, cost)

	//remove the salt and cost prefix (first 29 chars)
	if tr.err == nil {
		util.Erase(tr.bcryptHash[0:29])
		tr.bcryptHash = tr.bcryptHash[29:]
	}

	util.Erase(threadPassword)
	util.Erase(hexPass)
	
	result <- &tr
}







