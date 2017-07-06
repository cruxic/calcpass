/**Utility functions needed by calcpass.*/
package util

import (
	"io"
	"sort"
	"crypto/hmac"
	"crypto/sha256"
	"errors"
	"github.com/cruxic/go-hmac-drbg/hmacdrbg"
)

/**Request a single byte at a time from some abstract source.*/
type ByteSource interface {
	NextByte() (byte, error)
}

/**Implement ByteSource using a fixed-length slice of bytes.
It returns io.EOF once all bytes have been consumed.
*/
type FixedByteSource struct {
	//The bytes
	Bytes []byte
	
	//Index of the next byte which will be returned
	Index int
}

func (self *FixedByteSource) NextByte() (byte, error) {
	if self.Index >= len(self.Bytes) {
		return 0, io.EOF
	}
	
	v := self.Bytes[self.Index]
	self.Index++
	
	return v, nil
}

func HmacSha256(key, message []byte) []byte {
	hm := hmac.New(sha256.New, key)
	hm.Write(message)
	hash := hm.Sum(nil)
	hm.Reset() //erase what we can - alas the key has already been copied
	return hash
}

/**Create a random integer from [0, n) where n is <= 256.
This function returns uniformly distributed numbers (no modulo bias).

I am not using math/rand because Intn() consumes bits too quickly (64 at a time).

Returns error if the random source is exhausted or n exceeds 256.
*/
func UnbiasedSmallInt(source ByteSource, n int) (int, error) {
	//Solution from:
	//  https://zuttobenkyou.wordpress.com/2012/10/18/generating-random-numbers-without-modulo-bias/

	var err error;
	var b byte;
	const randmax = 255
	
	if n > (randmax + 1) {
		return -1, errors.New("UnbiasedSmallInt: n too large");
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

/**Fill given slice with zeros.*/
func Erase(sensitive []byte) {
	for i := range sensitive {
		sensitive[i] = 0
	}
}

/**A deterministic byteSource from hmacdrbg.
It uses HMAC/SHA-256 to generate the pseudo-random bytes
from a 256bit seed.
*/
type HmacDrbgByteSource struct {
	drbg *hmacdrbg.HmacDrbgReader
}


func NewHmacDrbgByteSource(seed32 []byte) *HmacDrbgByteSource {
	if len(seed32) != 32 {
		panic("bad seed length")
	}
	
	return &HmacDrbgByteSource {
		drbg: hmacdrbg.NewHmacDrbgReader(hmacdrbg.NewHmacDrbg(128, seed32, nil)),
	}
}

func (self *HmacDrbgByteSource) NextByte() (byte, error) {
	one := []byte{0}
	_, err := self.drbg.Read(one)
	if err != nil {
		return 0, err
	}

	return one[0], nil
}

type shuffleHelper struct {
	rand []int
	array []byte
}

func (self *shuffleHelper) Len() int {
	return len(self.array)
}

func (self *shuffleHelper) Less(i, j int) bool {
	return self.rand[i] < self.rand[j]
}

func (self *shuffleHelper) Swap(i, j int) {
	self.array[i], self.array[j] = self.array[j], self.array[i]
	self.rand[i], self.rand[j] = self.rand[j], self.rand[i]	
}

func SecureShuffleBytes(array []byte, rng ByteSource) error {
	n := len(array)
	if n > 0x7fff {
		return errors.New("SecureShuffleBytes: array too large")
	}

	sh := shuffleHelper{
		rand: make([]int, n),
		array: array,
	}

	//Create a random integer for every element of the array.
	//We must should duplicates to ensure predictable sorting.
	var r int
	var err error
	var b1, b2 byte
	used := make(map[int]bool)

	for i := range array {
		for {
			b1, err = rng.NextByte()
			if err != nil {
				return err
			}
			
			b2, err = rng.NextByte()
			if err != nil {
				return err
			}

			//combine 16bits
			r = (int(b1) << 8) | int(b2)

			if !used[r] {
				used[r] = true
				sh.rand[i] = r
				break
			}
		}
	}

	sort.Sort(&sh)

	return nil
}

/**Create an array of increasing byte values.*/
func ByteSequence(start byte, count int) []byte {
	res := make([]byte, count)
	for i := 0; i < count; i++ {
		res[i] = start + byte(i)
	}

	return res
}



