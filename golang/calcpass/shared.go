package calcpass

import (
	"golang.org/x/crypto/bcrypt"
	"github.com/cruxic/go-hmac-drbg/hmacdrbg"
	"fmt"
	//"encoding/hex"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/rand"
	"errors"
	"strings"
	"strconv"
)

const NumBcryptThreads = 4
const BcryptCost = 14
const typeA_yNames = "ABCDEFGHIJKLMNOPQRSTUV"
//The number of characters in a seed (after removing dashes and spaces)
const SeedLength = 32

const cardAlphabet = "abcdefghijklmnopqrstuvwxyz"

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

/**A coordinate on the card*/
type CardCoord struct {
	//Horizontal coordinate index, starting at 0
	X int
	//Vertical coordinate index, starting at 0
	Y int
	
	//The human friendly representation (eg "13W").
	HumanX string
	HumanY string
}

func (self *CardCoord) String() string {
	return self.HumanX + self.HumanY
}

type CoordinateNameFunc func(index int) string;

/**Generate a short, deterministic stream of pseudo-random bytes
using hmac-sha256.

The source will return an error if more than
8,192 bytes are requested (256 rehashes).  Given that most invokations
of MakeCoordinates use less than 32 bytes, this is more than ample.
*/
type sha256ByteSource struct {
	seed []byte
	counter uint
	nBytesUsed uint

	curHash []byte
	curIndex int
}

func newSha256ByteSource(seed []byte) *sha256ByteSource {
	//require 256bit seed for now
	if len(seed) != sha256.Size {
		panic("Seed wrong size")
	}

	src := &sha256ByteSource{
		curHash: make([]byte, 0),
		seed: make([]byte, len(seed)),
	}

	copy(src.seed, seed)
	
	return src
}

func (self *sha256ByteSource) NextByte() (byte, error) {
	if self.curIndex >= len(self.curHash) {
		if self.counter > 0xFF {
			return 0, errors.New("Counter limit reached")
		}

		erase(self.curHash)
		oneByte := []byte{byte(self.counter)}
		self.curHash = hmacSha256(self.seed, oneByte)
		self.curIndex = 0
		
		self.counter++		
	}

	b := self.curHash[self.curIndex]
	self.curIndex++
	self.nBytesUsed++
	return b, nil
}

func (self *sha256ByteSource) erase() {
	erase(self.seed)
	erase(self.curHash)
	//force end-of-stream
	self.counter = 256
	self.curIndex = len(self.curHash)
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
	sha = nil
	
	salts := getThreadSalts()
	
	//Derive a different key for each bcrypt thread to work on
	keys := [NumBcryptThreads][]byte{}
	for i, salt := range salts {
		keys[i] = hmacSha256(passwordShadow, salt)
	}
	
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
	
	//Concatenate the bcryptHashes sequentially and mix with passwordShadow
	allBcryptHashes := concatAll(bcryptHashes[:])
	finalHash := hmacSha256(passwordShadow, allBcryptHashes)
	
	//Cleanup
	erase(passwordShadow)
	erase(allBcryptHashes)
	for i := range keys {
		erase(keys[i]);
		erase(bcryptHashes[i]);
	}
	
	//prevent erase getting optimized away
	if (allBcryptHashes[0] + 
		keys[0][0] + 
		bcryptHashes[0][0] + 
		passwordShadow[0]) != 0 {
		panic("erase failed");
	}
	
	return finalHash, nil
}

/**Mix the card lock password with the website name, card-type, and desired revision number.
websiteName and cardType must be non-empty and are forced to lower case.  Revision must be >= 0.
The function will panic if any parameter is invalid.
*/
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
}

func typeA_xNameFunc(index int) string {
	return strconv.Itoa(index + 1)	
}

func typeA_yNameFunc(index int) string {
	if index >= len(typeA_yNames) {
		panic("index out of range")
	}
	
	return typeA_yNames[index:index+1]
}

func makeCoordinatesFromSource(src byte_source, count, cardSizeX, cardSizeY int,
	xNameFunc, yNameFunc CoordinateNameFunc) ([]CardCoord, error) {
		
	coords := make([]CardCoord, count)
	var err error
	
	for i := 0; i < count; i++ {
		coords[i].X, err = unbiased_rand_int8(src, cardSizeX)
		if err != nil {
			return nil, err
		}
		coords[i].Y, err = unbiased_rand_int8(src, cardSizeY)
		if err != nil {
			return nil, err
		}
		
		coords[i].HumanX = xNameFunc(coords[i].X)
		coords[i].HumanY = yNameFunc(coords[i].Y)
	}
	
	return coords, nil
}

/**Given the seed, deterministically generate `count` X,Y coordinates in the range
[0,cardSizeX), [0,cardSizeY).  The human friendly names for the coordinates are 
produced by xNameFunc and yNameFunc 
*/
func MakeCoordinates(seed []byte, count, cardSizeX, cardSizeY int,
	xNameFunc, yNameFunc CoordinateNameFunc) ([]CardCoord, error) {
	
	src := newSha256ByteSource(seed)
	defer src.erase()

	return makeCoordinatesFromSource(src, count, cardSizeX, cardSizeY, xNameFunc, yNameFunc)	
}

func concatAll(buffers [][]byte) []byte {
	all := make([]byte, 0, len(buffers[0]) + len(buffers))
	for i := range buffers {
		all = append(all, buffers[i]...)
	}
	return all
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
	hm.Reset() //erase what we can - alas the key has already been copied
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

type fixedByteSource struct {
	index int
	values []byte	
}

func (self *fixedByteSource) NextByte() (byte, error) {
	if self.index >= len(self.values) {
		return 0, errors.New("END")
	}
	
	v := self.values[self.index];
	self.index++;
	
	return v, nil
}

/**Generate a new seed from a secure-random source (crypto/rand).
The seed has slightly more than 128bits of entropy.  It is encoded
as 32 A-Z characters.  The last two characters
are a checksum.  Having only A-Z characters makes it easier for
users to input their seed (especially on a mobile device).
The seed is formatted for easy reading as 8 groups of 4, separated by dashes
like so:

	 ATXK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW

The A-Z encoding is one-way.  To convert the seed to bytes, hash
it with sha256 (uppercase, without the dashes).

This operation should only be done on a trusted computer.
*/
func CreateRandomSeed() (string, error) {
	var err error
	var b int
	const A = 65  //'A'
	const NUM_RAND_CHARS = SeedLength - 2
	rawChars := make([]byte, SeedLength)
	src := &fixedByteSource{
		values: make([]byte, 128),
	}

	//This loop usually executes only once
	i := 0
	for i < NUM_RAND_CHARS {
		//Get 128 secure-random bytes
		_, err = rand.Read(src.values)
		if err != nil {
			return "", err
		}
		
		//Convert each byte to A-Z
		src.index = 0
		for i < NUM_RAND_CHARS {
			b, err = unbiased_rand_int8(src, 26)
			if err != nil {
				//we need more randomness
				break
			}
			rawChars[i] = byte(A + b)
			i++
		}
	}
	
	//Create the checksum characters
	h := sha256.New()
	h.Write(rawChars[0:SeedLength-2])
	rawChk := h.Sum(nil)	
	rawChars[NUM_RAND_CHARS] = A + (rawChk[0] % 26)  //modulo bias doesn't hurt for a checksum
	rawChars[NUM_RAND_CHARS + 1] = A + (rawChk[1] % 26)

	//Create 8 groups of 4 characters separated by dashes
	compact := string(rawChars)
	dashed := ""
	i = 0
	for i < len(compact) {
		if i > 0 {
			dashed += "-"
		}
		dashed += compact[i:i+4]
		i += 4
	}
	
	return dashed, nil
}

/**
Convert the human readable seed, like "ATXK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW",
to bytes.  Returns an error if the seed is malformed or corrupt.  
The seed is not case sensitive and dashes and spaces are ignored.*/
func DigestSeed(seed string) ([]byte, error) {
	//remove dashes and white space
	seed = strings.Replace(seed, "-", "", -1)
	seed = strings.Replace(seed, " ", "", -1)
	seed = strings.Replace(seed, "\t", "", -1)
	
	if len(seed) != SeedLength {
		return nil, errors.New("Wrong seed length")
	}
	
	//force to upper case
	seed = strings.ToUpper(seed)
	
	//Must be A-Z
	const A = 65  //'A'
	const Z = 91  //'Z'
	for i := range seed {
		if seed[i] < A || seed[i] > Z {
			return nil, errors.New("Illegal character in seed")
		}
	}
	
	//digest and calc checksum
	h := sha256.New()
	h.Write([]byte(seed[0:SeedLength-2]))
	digested := h.Sum(nil)	
	chk1 := A + (digested[0] % 26)
	chk2 := A + (digested[1] % 26)
	
	if seed[SeedLength - 2] != chk1 || seed[SeedLength - 1] != chk2 {
		return nil, errors.New("Seed checksum fail")
	}
	
	return digested, nil
}

type Card struct {
	cardType string
	grid [][]byte
}

func (self *Card) Erase() {
	for row := range self.grid {
		erase(self.grid[row])
	}
}

/**Read from a row in the card.  Automatically wrap to the start of the row if necessary.*/
func (self *Card) GetCharsAutoWrap(row, column, count int) string {
	width := len(self.grid[0])
	res := make([]byte, count)
	
	n1 := column + count
	n2 := 0
	if n1 >= width {
		n1 -= width
		n2 = count - n1
	}
	
	copy(res, self.grid[row][column:column+n1])
	if n2 > 0 {
		copy(res[n1:], self.grid[row][0:n2])
	}
	
	return string(res)
}

func (self *Card) String() string {
	lines := make([]string, len(self.grid))
	for row := range self.grid {
		lines[row] = string(self.grid[row])
		fmt.Println("line", row, lines[row])
	}
	
	fmt.Println(len(lines))

	return strings.Join(lines, "\n")
}

func repeatAlphabet(alphabet string, nTotalChars int, rng byte_source) ([]byte, error) {
	//Repeat the alphabet nWhole times.
	nWhole := nTotalChars / len(alphabet)
	repeated := strings.Repeat(alphabet, nWhole)
	
	//For the remainder, shuffle the alphabet and take a slice of it
	remainder := []byte(alphabet)
	if len(remainder) != len(alphabet) {
		panic("unicode alphabet not supported")
	}
	err := secureShuffleBytes(remainder, rng)
	if err != nil {
		return nil, err
	}
	
	res := append([]byte(repeated), remainder[0:nTotalChars - len(repeated)]...)
	erase(remainder)
	return res, nil
}

func secureShuffleBytes(array []byte, rng byte_source) error {
	return nil
}


func CreateCard(digestedSeed []byte, width, height int, cardType string) (*Card, error) {
	if len(digestedSeed) != sha256.Size {
		return nil, errors.New("wrong digestedSeed length")
	}

	if width < 1 || height < 1 || width > len(typeA_yNames) {
		return nil, errors.New("width or height out of range")
	}

	n := width * height
	rng := newSha256ByteSource(digestedSeed)

	//I wish to have a roughly equal distribution of the letters A-Z.
	//For example, 'a' should occur roughly the same number of times as 'b'.
	// So instead of pulling letters out of a bag at random I'll start with
	// an equal distribution and then shuffle them randomly.
	//To use an extreme example, consider a card which had twice as many 'a'
	// than other letters.  That means that passwords from this card
	// would statistically have more 'a' characters.  This fact could
	// be exploited by an adversary who obtained a handful of my plaintext
	// passwords and noticed the statistical bias.

	chars, err := repeatAlphabet(cardAlphabet, n, rng)
	if err != nil {
		return nil, err
	}
	
	err = secureShuffleBytes(chars, rng)
	if err != nil {
		return nil, err
	}

	//Allocate card
	card := &Card{
		cardType: cardType,
		grid: make([][]byte, height),
	}
	
	//fill grid with shuffled characters
	i := 0
	for y := range card.grid {
		card.grid[y] = make([]byte, width)
		copy(card.grid[y], chars[i:i+width])
		i += width
	}
	if i != n {
		panic("assertion fail")
	}
	
	erase(chars)
	rng.erase()
	
	fmt.Println(hmacdrbg.MaxEntropyBytes)

	return card, nil
	
}
