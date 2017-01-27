package calcpass

import (
	"golang.org/x/crypto/bcrypt"
	//"fmt"
	//"encoding/hex"
	"crypto/hmac"
	"crypto/sha256"
	"errors"
)

const NumBcryptThreads = 4
const BcryptCost = 14

func erase(sensitive []byte) {
	for i := range sensitive {
		sensitive[i] = 0
	}
}

type thread_result struct {
	threadIndex int	
	bcryptHash []byte
	err error
}

type byte_source interface {
	NextByte() (byte, error)
}

//Constant salts for each thread (16 bytes each)
func getThreadSalts() [NumBcryptThreads][]byte {
	//there is nothing special about these constants - they were chosen randomly
	return [NumBcryptThreads][]byte{
		[]byte{0xa4,0xf8,0x01,0x6a,0x3f,0xc7,0x82,0xb2,0x1c,0xfa,0x2b,0xdf,0x55,0x9d,0x0b,0x2b},
		[]byte{0xcc,0x9f,0x7a,0x24,0xc8,0x7b,0x85,0xf3,0x91,0x80,0x29,0xee,0x7f,0x09,0x44,0x9a},
		[]byte{0x2a,0x34,0xbe,0xf1,0x9f,0xb4,0x0c,0xcd,0x69,0x7e,0xe9,0x70,0xb4,0x8e,0xab,0x15},
		[]byte{0x33,0xfc,0xf3,0x30,0x9f,0x26,0xd2,0x68,0x75,0xf5,0x4d,0x10,0x5c,0x58,0xc4,0xfe},
	}
}

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

Returns nil if plaintext is zero length.  Caller is expected to
 trim leading and trailing white space.
*/
func HashCardLockPassword(plaintextPassword []byte) ([]byte, error) {
	if len(plaintextPassword) == 0 {
		return nil, errors.New("empty password");
	}
	
	//In a garbage collected language like Go (or Java, JavaScript, etc) we have no guarantee that
	// any piece of memory is not going to be copied around.  The Go crypto designers
	// went as far as removing cipher.Block.Reset() because it "is promising something 
	//  that we can't deliver" (https://github.com/golang/go/issues/2841)
	//
	//That said, I'll make a best effort to avoid littering the heap with the plaintext.
	
	//Get away from the plaintext ASAP by hashing it
	var sha = sha256.New()
	sha.Write(plaintextPassword)
	passwordShadow := sha.Sum(nil)
	sha.Reset()
	plaintextPassword = nil  //caller must still erase it
	
	salts := getThreadSalts()
	
	//Derive a different key for each bcrypt thread to work on
	keys := [NumBcryptThreads][]byte{}
	for i, salt := range salts {
		keys[i] = hmacSha256(passwordShadow, salt)
	}
	
	erase(passwordShadow)
	
	//Spawn bcrypt threads.
	resultChan := make(chan *thread_result, NumBcryptThreads)
	for i := range keys {
		go bcryptThread(keys[i], salts[i], i, resultChan)
	}

	//Wait for threads to finish
	var bcryptHashes [NumBcryptThreads][]byte
	for _ = range keys {
		res := <-resultChan
		if res.err != nil {
			//will not happen because key and salt are known-good length
			return nil, res.err
		}
		
		//sanity
		if bcryptHashes[res.threadIndex] != nil {
			panic("duplicate thread index")
		}
		
		bcryptHashes[res.threadIndex] = res.bcryptHash
	}
	
	//Digest the bcryptHashes sequentially
	sha.Reset()
	for i := range bcryptHashes {
		sha.Write(bcryptHashes[i])
	}
	
	finalHash := sha.Sum(nil)
	
	//Cleanup
	sha.Reset()
	for i := range keys {
		erase(keys[i]);
		erase(bcryptHashes[i]);
	}
	
	//prevent erase getting optimized away
	if (keys[0][0] + bcryptHashes[0][0] + passwordShadow[0]) != 0 {
		panic("erase failed");
	}
	
	return finalHash, nil
}

func bcryptThread(password, salt []byte, threadIndex int, result chan *thread_result) {
	var tr thread_result
	tr.threadIndex = threadIndex
	tr.bcryptHash, tr.err = bcrypt.GenerateFromPasswordAndSalt(password, salt, BcryptCost)
	
	//remove salt and cost prefix (first 29 chars)
	if tr.err == nil {
		tr.bcryptHash = tr.bcryptHash[29:]
	}

	result <- &tr
}


func hmacSha256(key, message []byte) []byte {
	hm := hmac.New(sha256.New, key)
	hm.Write(message)
	hash := hm.Sum(nil)
	return hash
}

/**Create a random integer from [0, n) where n is <= 256.
This function returns uniformly distributed numbers (no modulo bias).

I am not using math/rand because Intn() consumes bits too quickly (64 at a time).

Returns error if the random source is exhausted or n exceeds 256.
*/
func unbiased_rand_int8(source byte_source, n int) (int, error) {
	//Solution from:
	//  https://zuttobenkyou.wordpress.com/2012/10/18/generating-random-numbers-without-modulo-bias/

	var err error;
	var b byte;
	const randmax = 255
	
	if n > (randmax + 1) {
		return -1, errors.New("unbiased_rand_int8: n too large");
	}
	
	rand_limit := randmax - ((randmax+1) % n);
	r := rand_limit + 1;
	
	for r > rand_limit {
		b, err = source.NextByte();
		if err != nil {
			return -1, err;
		}

		r = int(b);
	}

	return r % n, nil;
}
