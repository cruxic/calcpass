package card

import (
	"testing"
	"github.com/stretchr/testify/assert"
	"io"
	"crypto/sha256"
	"fmt"
	"encoding/hex"
	"strings"

)

/**Cycle through all byte values*/
type cycle_byte_source struct {
	nextVal uint
	cycleCount int
	maxCycleCount int
}

func (self *cycle_byte_source) reset() {
	self.nextVal = 0
	self.cycleCount = 0
}

func (self *cycle_byte_source) NextByte() (byte, error) {
	if self.cycleCount > self.maxCycleCount {
		return 0, io.EOF
	}

	b := byte(self.nextVal)
	self.nextVal++

	if self.nextVal > 0xFF {
		self.cycleCount++
		self.nextVal = 0
	}

	return b, nil
}

func TestNameFuncs(t *testing.T) {
	if typeA_xNameFunc(0) != "1" || typeA_xNameFunc(99) != "100" {
		t.Fail()
		return
	}

	if typeA_yNameFunc(0) != "A" || typeA_yNameFunc(1) != "B" {
		t.Fail()
		return
	}

	var expect string
	for i := 0; i < len(typeA_yNames); i++ {
		expect = typeA_yNames[i:i+1]
		if typeA_yNameFunc(i) != expect {
			t.Error(i)
			return
		}
	}
}

func TestMakeCoordinates(t *testing.T) {
	assert := assert.New(t)

	//Test against ascending byteSource
	
	src := &cycle_byte_source{
		maxCycleCount: 9999,		
	}

	coords, err := makeCoordinatesFromSource(src, 20, 13, 17, typeA_xNameFunc, typeA_yNameFunc)
	assert.Nil(err)
	assert.Equal(20, len(coords))

	r := 0
	for _, coord := range coords {
		if coord.X != (r % 13) {
			t.Error(coord.X, r)
			return
		}
		r++
		if coord.Y != (r % 17) {
			t.Error(coord.Y, r)
			return
		}
		r++
	}

	//Test against fixed key

	key := make([]byte, sha256.Size)
	key[0] = 1
	key[15] = 127
	key[31] = 255
	
	coords, err = MakeCoordinates(key, 20, 13, 17, typeA_xNameFunc, typeA_yNameFunc)
	assert.Nil(err)
	assert.Equal(20, len(coords))

	rawXY := ""
	human := ""
	for _, coord := range coords {
		rawXY += fmt.Sprintf("%d,%d ", coord.X, coord.Y)
		human += coord.String() + " "
	}

	assert.Equal("7,5 9,15 5,15 4,4 5,7 9,7 7,15 4,7 5,7 11,16 0,14 0,5 1,3 5,3 8,15 0,10 4,3 1,7 12,7 12,9 ", rawXY)
	assert.Equal("8F 10P 6P 5E 6H 10H 8P 5H 6H 12Q 1O 1F 2D 6D 9P 1K 5D 2H 13H 13J ", human)
}

func TestCreateRandomSeed(t *testing.T) {
	//Different result upon every invokation
	s1, err1 := CreateRandomSeed()
	s2, err2 := CreateRandomSeed()
	if err1 != nil || err2 != nil {
		t.Error(err1, err2)
	}
	
	if s1 == s2 {
		t.Error(s1)
		return
	}
	
	//Properly formatted and checksumed
	_, err1 = DigestSeed(s1)
	_, err2 = DigestSeed(s2)
	if err1 != nil || err2 != nil {
		t.Error(err1, err2)
	}
}

func TestDigestSeed(t *testing.T) {
	assert := assert.New(t)
	
	d, err := DigestSeed("ATXK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW")
	assert.Nil(err)
	assert.Equal(sha256.Size, len(d))
	assert.Equal("7dcc2ef2201a22cedd07eb25459cb40b60115c0d104af8ab98f6a84cc6846344", hex.EncodeToString(d))
	
	//verify correct digestion
	h := sha256.New()
	h.Write([]byte("ATXKXGFGTSPFJSCGKEMDYTBJZWEBLD"))
	d2 := h.Sum(nil)
	assert.Equal(d, d2)
	
	//case insenstive and white space and dashes are ignored
	d, err = DigestSeed(" \t AtxK-XGFG-TSPF- - -JsCGKEMDYTBJ\t- ZWEB ---LDvw")
	assert.Nil(err)
	assert.Equal(d, d2)

	//too short
	_, err = DigestSeed("TXK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW")
	assert.NotNil(err)
	
	//too long
	_, err = DigestSeed("AATXK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW")
	assert.NotNil(err)
	
	//illegal character
	_, err = DigestSeed("A9XK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW")
	assert.NotNil(err)
}

func TestCreateCard(t *testing.T) {
	assert := assert.New(t)
	
	seed := make([]byte, sha256.Size)
	seed[0] = 1
	seed[15] = 127
	seed[31] = 255
	
	card, err := CreateCard(seed, 7, 4, "Z")  //28 chars total
	if err != nil {
		t.Error(err)
		return
	}

	chars := card.String()
	chars = strings.Replace(chars, "\n", "", -1)

	//Only 2 characters occur twice
	freq := letterFrequency(chars)
	nOnce := 0
	nTwice := 0

	assert.Equal(len(freq), 26)
	
	for c, count := range freq {
		if count == 1 {
			nOnce += 1
		} else if count == 2 {
			nTwice += 1
		} else {
			t.Error(c, count)
		}
	}

	assert.Equal(24, nOnce)
	assert.Equal(2, nTwice)

	assert.Equal("fgychmlspjnodbaqukwztrgcxvei", chars)

	//Different seed gives totally different shuffle
	seed[0]++
	card, err = CreateCard(seed, 7, 4, "Z")
	if err != nil {
		t.Error(err)
		return
	}

	chars = card.String()
	chars = strings.Replace(chars, "\n", "", -1)
	assert.Equal("yxljesvdfvabpmzlnktowurhigqc", chars)
}

func letterFrequency(text string) map[string]int {
	m := make(map[string]int)

	for i := range text {
		c := string(text[i])
		m[c] += 1
	}

	return m
}


func TestCardGetCharsAtCoordinate(t *testing.T) {
	assert := assert.New(t)

	seed := make([]byte, sha256.Size)
	seed[0] = 1
	seed[15] = 127
	seed[31] = 255
	
	card, err := CreateCard(seed, 7, 4, "Z")  //28 chars total
	if err != nil {
		t.Error(err)
		return
	}

	assert.Equal("fgychml\nspjnodb\naqukwzt\nrgcxvei", card.String())

	//1 char at a time
	assert.Equal("f", card.GetCharsAtCoordinate(0, 0, 1))
	assert.Equal("g", card.GetCharsAtCoordinate(1, 0, 1))
	assert.Equal("y", card.GetCharsAtCoordinate(2, 0, 1))
	assert.Equal("c", card.GetCharsAtCoordinate(3, 0, 1))
	assert.Equal("h", card.GetCharsAtCoordinate(4, 0, 1))
	assert.Equal("m", card.GetCharsAtCoordinate(5, 0, 1))
	assert.Equal("l", card.GetCharsAtCoordinate(6, 0, 1))
	assert.Panics(func() {
		_ = card.GetCharsAtCoordinate(7, 0, 1)
	})
	

	//2 chars at a time
	assert.Equal("sp", card.GetCharsAtCoordinate(0, 1, 2))
	assert.Equal("pj", card.GetCharsAtCoordinate(1, 1, 2))
	assert.Equal("jn", card.GetCharsAtCoordinate(2, 1, 2))
	assert.Equal("no", card.GetCharsAtCoordinate(3, 1, 2))
	assert.Equal("od", card.GetCharsAtCoordinate(4, 1, 2))
	assert.Equal("db", card.GetCharsAtCoordinate(5, 1, 2))
	assert.Equal("bs", card.GetCharsAtCoordinate(6, 1, 2))

	//3 chars at a time
	assert.Equal("aqu", card.GetCharsAtCoordinate(0, 2, 3))
	assert.Equal("quk", card.GetCharsAtCoordinate(1, 2, 3))
	assert.Equal("ukw", card.GetCharsAtCoordinate(2, 2, 3))
	assert.Equal("kwz", card.GetCharsAtCoordinate(3, 2, 3))
	assert.Equal("wzt", card.GetCharsAtCoordinate(4, 2, 3))
	assert.Equal("zta", card.GetCharsAtCoordinate(5, 2, 3))
	assert.Equal("taq", card.GetCharsAtCoordinate(6, 2, 3))
	
	//6 chars at a time
	assert.Equal("rgcxve", card.GetCharsAtCoordinate(0, 3, 6))
	assert.Equal("gcxvei", card.GetCharsAtCoordinate(1, 3, 6))
	assert.Equal("irgcxv", card.GetCharsAtCoordinate(6, 3, 6))

	//7 chars at a time
	assert.Equal("fgychml", card.GetCharsAtCoordinate(0, 0, 7))
	assert.Equal("gychmlf", card.GetCharsAtCoordinate(1, 0, 7))

	//8 panics
	assert.Panics(func() {
		_ = card.GetCharsAtCoordinate(0, 0, 8)
	})
	
	
}
