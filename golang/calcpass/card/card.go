/**
Code for generating a printable wallet-sized card containing
random password characters.

*/
package card

import (
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"crypto/rand"
	"crypto/sha256"
	"strings"
	"errors"
	"strconv"
)

//The number of characters in a seed (after removing dashes and spaces)
const SeedLength = 32


const cardAlphabet = "abcdefghijklmnopqrstuvwxyz"

const typeA_yNames = "ABCDEFGHIJKLMNOPQRSTUV"
const typeAcardWidth = 22
const typeAcardHeight = 15


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
	src := &util.FixedByteSource{
		Bytes: make([]byte, 128),
	}

	//This loop usually executes only once
	i := 0
	for i < NUM_RAND_CHARS {
		//Get 128 secure-random bytes
		_, err = rand.Read(src.Bytes)
		if err != nil {
			return "", err
		}
		
		//Convert each byte to A-Z
		src.Index = 0
		for i < NUM_RAND_CHARS {
			b, err = util.UnbiasedSmallInt(src, 26)
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
		util.Erase(self.grid[row])
	}
}

/**Read the characters at a given coordinate.  Automatically wrap to the start of the row if necessary.
This function panics if the coordinates are out of bounds or the count exceeds the length of a row.*/
func (self *Card) GetCharsAtCoordinate(x, y, count int) string {
	res := make([]byte, count)
	width := len(self.grid[0])

	if count > width {
		panic("count exceeds width")
	}

	for i := 0; i < count; i++ {
		res[i] = self.grid[y][x]
		x++
		if x >= width {
			x = 0
		}
	}
	
	return string(res)
}

func (self *Card) String() string {
	lines := make([]string, len(self.grid))
	for row := range self.grid {
		lines[row] = string(self.grid[row])
	}
	
	return strings.Join(lines, "\n")
}

func CreateCard(digestedSeed []byte, width, height int, cardType string) (*Card, error) {
	if len(digestedSeed) != sha256.Size {
		return nil, errors.New("wrong digestedSeed length")
	}

	if width < 1 || height < 1 || width > len(typeA_yNames) {
		return nil, errors.New("width or height out of range")
	}

	rng := util.NewHmacDrbgByteSource(digestedSeed)

	n := width * height

	//I wish to have a roughly equal distribution of the letters A-Z.
	//For example, 'a' should occur roughly the same number of times as 'b'.
	// So instead of pulling letters out of a bag at random I'll start with
	// an equal distribution and then shuffle them randomly.
	//To use an extreme example, consider a card which had twice as many 'a'
	// than other letters.  That means that passwords from this card
	// would statistically have more 'a' characters.  This fact could
	// be exploited by an adversary who obtained a handful of my plaintext
	// passwords and noticed the statistical bias.

	//Repeat the cardAlphabet a whole number of times
	repeated := ""
	for len(repeated) + len(cardAlphabet) <= n {
		repeated += cardAlphabet
	}

	//For the remainder, shuffle the alphabet and take the prefix
	nMore := n - len(repeated)
	if nMore > 0 {
		mixedAlphabet := []byte(cardAlphabet)
		err := util.SecureShuffleBytes(mixedAlphabet, rng)
		if err != nil {
			return nil, err
		}

		repeated += string(mixedAlphabet[0:nMore])
	}

	//sanity
	if len(repeated) != n {
		return nil, errors.New("unicode problem")
	}

	//Randomize the order using the seed
	chars := []byte(repeated)	
	err := util.SecureShuffleBytes(chars, rng)
	if err != nil {
		return nil, err
	}

	//Discard the excess chars
	chars = chars[0:n]

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
	
	util.Erase(chars)

	return card, nil
	
}

func CreateTypeACard(seedStr string) (*Card, error) {
	rawSeed, err := DigestSeed(seedStr)
	if err != nil {
		return nil, err
	}
	
	return CreateCard(rawSeed, typeAcardWidth, typeAcardHeight, "A")
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


func typeA_xNameFunc(index int) string {
	return strconv.Itoa(index + 1)	
}

func typeA_yNameFunc(index int) string {
	if index >= len(typeA_yNames) {
		panic("index out of range")
	}
	
	return typeA_yNames[index:index+1]
}

func makeCoordinatesFromSource(src util.ByteSource, count, cardSizeX, cardSizeY int,
	xNameFunc, yNameFunc CoordinateNameFunc) ([]CardCoord, error) {
		
	coords := make([]CardCoord, count)
	var err error

	for i := 0; i < count; i++ {
		coords[i].X, err = util.UnbiasedSmallInt(src, cardSizeX)
		if err != nil {
			return nil, err
		}
		coords[i].Y, err = util.UnbiasedSmallInt(src, cardSizeY)
		if err != nil {
			return nil, err
		}

		coords[i].HumanX = xNameFunc(coords[i].X)
		coords[i].HumanY = yNameFunc(coords[i].Y)
	}
	
	return coords, nil
}

/**Given the 32 byte key (from GetKeyForWebsite), deterministically generate `count` X,Y coordinates in the range
[0,cardSizeX), [0,cardSizeY).  The human friendly names for the coordinates are 
produced by xNameFunc and yNameFunc 
*/
func MakeCoordinates(key []byte, count, cardSizeX, cardSizeY int,
	xNameFunc, yNameFunc CoordinateNameFunc) ([]CardCoord, error) {
	
	src := util.NewHmacDrbgByteSource(key)
	return makeCoordinatesFromSource(src, count, cardSizeX, cardSizeY, xNameFunc, yNameFunc)	
}

/**Make coordinates for a type A card.*/
func MakeTypeACoordinates(key []byte) ([]CardCoord, error) {
	return MakeCoordinates(key, 4, typeAcardWidth, typeAcardHeight, typeA_xNameFunc, typeA_yNameFunc)
}
