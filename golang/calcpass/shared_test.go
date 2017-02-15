package calcpass

import (
	"testing"
	"encoding/hex"
	"errors"
	"fmt"
	"crypto/sha256"
	"bytes"
	"github.com/stretchr/testify/assert"
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
		return 0, errors.New("END")
	}

	b := byte(self.nextVal)
	self.nextVal++

	if self.nextVal > 0xFF {
		self.cycleCount++
		self.nextVal = 0
	}

	return b, nil
}

/*func read_all_unbiased_rand_int8(src byteSource, n int) []int {
	var values []int;
	for i := 0; i < 9999; i++ {
		b, err := unbiased_rand_int8(src, n);
		if err != nil {
			return values;
		}

		values = append(values, b);		
	}

	return nil;
}*/

type rand_int8_func func (byteSource, int)(int,error)

func hasGoodDistribution(src byteSource, fn rand_int8_func, n int) bool {
	counts := make([]int, n)
	
	iterations := 3 * 256  //do at least 3 cycles of 0-255 from the byteSource
	
	for i := 0; i < iterations * 2; i++ {
		b, err := fn(src, n)
		if err != nil {
			return false
		}

		counts[b]++
		
		//After we have done the target number of iterations check
		// if the counts are uniformly distributed (identical counts).
		if i > iterations {
			uniform := true
			for j := 1; j < n; j++ {
				if counts[0] != counts[j] {
					uniform = false
					break
				}			
			}
			if uniform {
				//fmt.Printf("n=%d was uniform after %d iterations\n", n, i)
				return true
			}
		}
	}

	//fmt.Printf("%d\t: ", n)
	//fmt.Println(counts)

	return false
}


func intSliceEq(a, b []int) bool {
	if a == nil && b == nil { 
		return true; 
	}

	if a == nil || b == nil { 
		return false; 
	}

	if len(a) != len(b) {
		return false
	}

	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}

	return true
}

func bad_rand_int8(source byteSource, n int) (int, error) {
	b, err := source.NextByte();
	if err != nil {
		return -1, err;
	} else {
		return int(b) % n, nil
	}
}

func baseline_rand_int8(source byteSource, n int) (int, error) {
	b, err := source.NextByte();
	if err != nil {
		return -1, err;
	} else {
		return int(b) % n, nil
	}
}

func TestUnbiased_rand_int8(t *testing.T) {
	//Test it against math/rand.Intn()

	src := &cycle_byte_source{
		maxCycleCount: 9999,		
	}

	//bad_rand_int8 suffers from modulo bias
	if hasGoodDistribution(src, bad_rand_int8, 26) {
		t.Error("hasGoodDistribution is broken")
		return
	}
	
	//Test unbiased_rand_int8 with all possible N
	for n := 1; n <= 256; n++ {
		src.reset()
		if !hasGoodDistribution(src, unbiased_rand_int8, n) {
			t.Errorf("unbiased_rand_int8 is non-uniform with n=%d", n)
			return
		}
	}
	
	//n too large
	src.reset()
	_, err := unbiased_rand_int8(src, 257)
	if err == nil {
		t.Error("expected error but got none")
	}
	
	//souce exhausted
	src.reset()
	src.cycleCount = src.maxCycleCount + 1
	_, err = unbiased_rand_int8(src, 26)
	if err == nil {
		t.Error("expected error but got none")
	}
}

//Make sure I'm using hmac and sha256 correctly
func TestHmacSha256(t *testing.T) {
	//I created this test vector from an online tool
	hash := hex.EncodeToString(hmacSha256([]byte("SuperSecretPassword"), []byte("Hello World!")));
	expect := "ea6c66229109f1321b0088c42111069e9794c3aed574e837b6e87c6d14931aef"
	if hash != expect {
		t.Errorf("Got %s but expected %s", hash, expect)
	}
}

func TestConcatAll(t *testing.T) {
	slices := [][]byte{
		[]byte{1,2,3},
		[]byte{4,5,6,7},
		[]byte{8,9},
	}
	
	res := concatAll(slices)
	got := hex.EncodeToString(res)
	expect := "010203040506070809"
	if got != expect {
		t.Error("concatAll failed: ", got)
	}
}


func TestGetKeyForWebsite(t *testing.T) {
	passHash := make([]byte, sha256.Size)
	passHash[0] = 1
	passHash[15] = 127
	passHash[31] = 255
	
	res1 := hex.EncodeToString(GetKeyForWebsite(passHash, "ExAmPlE.CoM", "a", 3))	
	res2 := hex.EncodeToString(hmacSha256(passHash, []byte("a3example.com")))
	
	if res1 != res2 {
		t.Errorf("%s != %s", res1, res2)
	}

	if res1 != "50ba3f6d12fe8e51641aaee2c2b7749fedc77c9fbe122bdbddf337ef32752fc0" {
		t.Error("Wrong output:", res1)
	}
}

func readManyFromByteSource(src byteSource, count int) ([]byte, error) {
	all := make([]byte, count)
	for i := range all {
		b, err := src.NextByte()
		if err != nil {
			return nil, err
		}
		all[i] = b
	}
	
	return all, nil
}


func TestHmacDrbgByteSource(t *testing.T) {
	assert := assert.New(t)

	//I created this test vector with https://github.com/fpgaminer/python-hmac-drbg
	seed32 := make([]byte, 32)
	for i := range seed32 {
		seed32[i] = 97  //'a'
	}

	rng := newHmacDrbgByteSource(seed32)

	//seed has been copied so this has no effect
	seed32[0]++
	

	output := make([]byte, 33)

	for i := range output {
		b, err := rng.NextByte()
		if err != nil {
			t.Error(err)
			return
		}
		output[i] = b
	}

	got := hex.EncodeToString(output)
	assert.Equal("e73263df2c62f5cc89cf9619677e0ecb49d58df04a967ac9ca64a4e9ccb30ba209", got)
}


func TestNameFuncs(t *testing.T) {
	if typeA_xNameFunc(0) != "1" || typeA_xNameFunc(99) != "100" {
		t.Fail()
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

	//Test against ascending byteSource
	
	src := &cycle_byte_source{
		maxCycleCount: 9999,		
	}

	coords, err := makeCoordinatesFromSource(src, 20, 13, 17, typeA_xNameFunc, typeA_yNameFunc)
	if err != nil {
		t.Error(err)
		return
	}

	if len(coords) != 20 {
		t.Error("wrong len")
		return
	}

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

	//Test against fixed seed

	seed := make([]byte, sha256.Size)
	seed[0] = 1
	seed[15] = 127
	seed[31] = 255
	
	coords, err = MakeCoordinates(seed, 20, 13, 17, typeA_xNameFunc, typeA_yNameFunc)
	if err != nil {
		t.Error(err)
		return
	}

	if len(coords) != 20 {
		t.Error("wrong len")
		return
	}	

	rawXY := ""
	human := ""
	for _, coord := range coords {
		rawXY += fmt.Sprintf("%d,%d ", coord.X, coord.Y)
		human += coord.String() + " "
	}

	expectXY := "7,5 9,15 5,15 4,4 5,7 9,7 7,15 4,7 5,7 11,16 0,14 0,5 1,3 5,3 8,15 0,10 4,3 1,7 12,7 12,9 "
	expectHuman := "8F 10P 6P 5E 6H 10H 8P 5H 6H 12Q 1O 1F 2D 6D 9P 1K 5D 2H 13H 13J "

	if rawXY != expectXY {
		t.Error(rawXY)
	}

	if human != expectHuman {
		t.Error(human)
	}
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
	d, err := DigestSeed("ATXK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW")
	if err != nil {
		t.Error(err)
		return
	}
	
	if len(d) != sha256.Size {
		t.Fail()
	}
	
	if hex.EncodeToString(d) != "7dcc2ef2201a22cedd07eb25459cb40b60115c0d104af8ab98f6a84cc6846344" {
		t.Fail()
	}
	
	//verify correct digestion
	h := sha256.New()
	h.Write([]byte("ATXKXGFGTSPFJSCGKEMDYTBJZWEBLD"))
	d2 := h.Sum(nil)
	if !bytes.Equal(d, d2) {
		t.Fail()
	}
	
	//case insenstive and white space and dashes are ignored
	d, err = DigestSeed(" \t AtxK-XGFG-TSPF- - -JsCGKEMDYTBJ\t- ZWEB ---LDvw")
	if err != nil {
		t.Error(err)
		return
	}
	if !bytes.Equal(d, d2) {
		t.Fail()
	}

	//too short
	_, err = DigestSeed("TXK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW")
	if err == nil {
		t.Fail()
	}
	
	//too long
	_, err = DigestSeed("AATXK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW")
	if err == nil {
		t.Fail()
	}
	
	//illegal character
	_, err = DigestSeed("A9XK-XGFG-TSPF-JSCG-KEMD-YTBJ-ZWEB-LDVW")
	if err == nil {
		t.Fail()
	}
	
	
	
}

func TestSecureShuffleBytes(t *testing.T) {
	assert := assert.New(t)

	src := &fixedByteSource{
		values: []byte{
			0x01,0x09,  //a
			0x01,0x06,  //b
			0x01,0xA1,  //c
			0x02,0x03,  //d
			0x01,0x05,  //e
			0x01,0x06,  //duplicate skipped
			0x01,0xA0,  //f
			0x01,0x03,  //g
		},
		//0xef occurs twice
	}

	a := []byte("abcdefg")
	err := secureShuffleBytes(a, src)
	assert.Nil(err)
	assert.Equal("gebafcd", string(a))

	//Shuffle large array

	//Here are 1,190 integers.  Of these, only 310 are distinct.
	// 250,100,261,135,97,41,80,242,287,28,95,21,232,93,256,218,255,133,297,23,257,218,259,184,18,117,170,106,302,119,269,217,119,231,117,270,209,75,200,171,318,44,76,160,71,221,93,308,205,192,11,177,296,105,118,280,189,317,297,43,285,315,245,266,174,116,230,206,219,288,35,114,130,187,158,112,202,11,36,167,220,
	// 212,35,243,97,246,72,126,174,198,158,168,203,263,5,203,64,192,211,0,59,61,308,218,309,306,275,298,163,203,177,82,187,238,207,226,167,65,134,127,163,70,232,42,2,246,53,30,24,242,285,208,56,55,258,14,300,14,32,193,14,232,65,188,213,59,75,93,150,46,254,99,169,255,36,151,115,84,279,275,224,24,215,112,78,299,
	// 87,129,229,127,178,229,92,1,213,117,315,110,94,267,55,143,142,303,121,236,297,247,317,194,225,16,51,141,312,257,40,227,161,93,2,133,104,295,180,103,184,304,113,107,268,276,9,160,288,317,305,134,239,59,129,213,267,144,162,137,70,79,114,216,258,170,244,162,252,58,138,269,90,283,72,302,287,216,166,144,149,
	// 133,172,188,103,313,276,244,145,284,182,243,287,82,200,282,276,245,94,123,52,265,314,56,135,270,68,64,157,165,51,110,9,52,60,14,28,201,15,142,190,120,108,140,273,216,242,97,127,198,91,151,296,8,117,238,51,71,296,156,123,267,146,145,298,214,312,145,133,131,17,63,207,139,120,166,101,164,291,113,257,216,108,
	// 98,300,244,227,32,130,19,194,194,116,160,319,19,230,236,9,249,260,265,117,186,10,195,54,267,11,115,186,288,0,236,77,254,12,179,300,18,285,287,0,206,302,180,231,77,289,249,312,307,193,8,183,298,166,40,302,46,156,140,102,78,315,133,222,14,48,8,283,174,280,80,198,184,319,1,209,129,150,5,184,56,246,85,211,157,
	// 164,132,299,104,52,276,115,101,1,171,73,126,159,141,48,184,298,296,124,263,88,46,182,137,192,62,317,45,92,92,114,223,240,217,278,77,83,111,231,132,115,302,293,271,277,14,179,212,279,274,277,206,134,149,73,29,53,6,178,316,12,158,318,181,290,142,202,318,186,299,202,254,207,303,192,247,223,25,154,167,117,307,
	// 285,44,289,89,3,103,37,230,84,268,229,25,298,231,229,201,277,103,225,235,14,177,124,140,286,137,204,155,243,247,219,174,244,188,3,215,41,162,137,239,67,235,201,14,269,262,89,184,206,244,83,220,80,208,197,116,194,243,240,43,94,76,222,21,46,172,317,160,180,141,225,143,52,60,303,310,275,82,65,1,59,93,43,172,
	// 58,63,304,235,263,179,135,282,237,97,51,65,252,74,7,202,217,102,152,319,252,93,59,28,313,312,263,80,150,78,24,116,276,297,230,62,63,119,160,139,104,78,216,64,235,279,204,159,13,267,16,0,308,103,75,78,121,164,23,256,186,158,225,248,60,192,225,27,223,90,45,118,199,25,169,35,193,300,99,204,261,293,176,220,312,
	// 263,36,255,35,112,139,127,84,180,46,183,273,80,266,254,215,303,83,59,98,58,276,5,232,275,26,178,308,115,56,309,45,68,289,185,218,149,227,135,236,214,72,229,247,2,45,122,110,133,14,166,63,90,255,111,69,195,241,274,119,118,263,133,269,67,87,199,308,246,243,304,90,33,200,213,45,121,160,93,284,136,32,93,204,115,
	// 103,105,229,297,90,140,249,177,312,116,126,46,269,240,254,144,163,29,226,298,130,64,52,153,3,171,5,138,81,83,16,140,197,115,193,314,319,305,272,281,234,8,59,93,83,157,308,151,15,44,41,165,157,247,300,16,293,123,276,91,309,161,102,116,167,197,8,230,161,198,137,295,150,104,153,109,192,267,115,210,137,142,17,
	// 163,145,164,205,61,179,18,124,110,215,268,226,140,149,18,146,157,94,221,14,13,313,150,252,240,89,299,41,64,16,215,282,253,244,286,214,60,71,306,80,132,174,218,165,49,127,66,257,115,303,199,210,82,110,277,6,293,207,297,58,144,71,232,88,48,142,242,41,71,135,287,120,99,75,235,244,166,93,170,271,164,42,269,240,
	// 67,299,41,49,257,284,287,155,49,75,267,256,312,36,207,298,161,74,279,278,275,218,165,56,10,152,69,196,270,30,196,297,86,112,186,49,208,309,143,49,86,58,211,288,119,174,280,260,10,34,131,214,79,251,54,317,229,5,257,202,44,289,71,171,174,225,302,284,123,20,108,306,200,303,191,11,157,15,31,222,203,215,176,129,
	// 98,53,251,146,269,200,155,230,189,53,244,72,24,285,176,69,197,234,86,282,69,241,79,59,265,75,172,195,285,138,298,51,4,114,39,160,75,35,294,167,234,284,92,42,271,173,296,174,173,95,94,45,39,146,144,121,260,263,87,67,34,142,65,219,7,169,253,22,247,135,116,315,310,179,27,317,6,169,133,121,187,134,245,246,267,
	// 125,58,273,209,3,272,46,108,7,122,273,73,16,139,222,34,216,24,175,78,95,175,198,168,39,161,136,195,75,298,278,187,142,204,104,270,69,147,198,224,73,21,207,133,296,64,53,293,30,8,319,223,247,279,200,267,151,167,145,292,111,34,247,178,163,76,156,3,290,289,184,135,200,200,143,259,114,116,245,315,25,263,305,232,
	// 256,298,161,114,57,79,115,156,0,190,277,26,188,230,266,112,260,155,73,128

	//This is the big-endian representation of the above bytes.
	src.index = 0
	src.values = []byte{
		0x00,0xfa, 0x00,0x64, 0x01,0x05, 0x00,0x87, 0x00,0x61, 0x00,0x29, 0x00,0x50, 0x00,0xf2, 0x01,0x1f, 0x00,0x1c, 0x00,0x5f, 0x00,0x15, 0x00,0xe8, 0x00,0x5d, 0x01,0x00, 0x00,0xda, 
		0x00,0xff, 0x00,0x85, 0x01,0x29, 0x00,0x17, 0x01,0x01, 0x00,0xda, 0x01,0x03, 0x00,0xb8, 0x00,0x12, 0x00,0x75, 0x00,0xaa, 0x00,0x6a, 0x01,0x2e, 0x00,0x77, 0x01,0x0d, 0x00,0xd9, 
		0x00,0x77, 0x00,0xe7, 0x00,0x75, 0x01,0x0e, 0x00,0xd1, 0x00,0x4b, 0x00,0xc8, 0x00,0xab, 0x01,0x3e, 0x00,0x2c, 0x00,0x4c, 0x00,0xa0, 0x00,0x47, 0x00,0xdd, 0x00,0x5d, 0x01,0x34, 
		0x00,0xcd, 0x00,0xc0, 0x00,0x0b, 0x00,0xb1, 0x01,0x28, 0x00,0x69, 0x00,0x76, 0x01,0x18, 0x00,0xbd, 0x01,0x3d, 0x01,0x29, 0x00,0x2b, 0x01,0x1d, 0x01,0x3b, 0x00,0xf5, 0x01,0x0a, 
		0x00,0xae, 0x00,0x74, 0x00,0xe6, 0x00,0xce, 0x00,0xdb, 0x01,0x20, 0x00,0x23, 0x00,0x72, 0x00,0x82, 0x00,0xbb, 0x00,0x9e, 0x00,0x70, 0x00,0xca, 0x00,0x0b, 0x00,0x24, 0x00,0xa7, 
		0x00,0xdc, 0x00,0xd4, 0x00,0x23, 0x00,0xf3, 0x00,0x61, 0x00,0xf6, 0x00,0x48, 0x00,0x7e, 0x00,0xae, 0x00,0xc6, 0x00,0x9e, 0x00,0xa8, 0x00,0xcb, 0x01,0x07, 0x00,0x05, 0x00,0xcb, 
		0x00,0x40, 0x00,0xc0, 0x00,0xd3, 0x00,0x00, 0x00,0x3b, 0x00,0x3d, 0x01,0x34, 0x00,0xda, 0x01,0x35, 0x01,0x32, 0x01,0x13, 0x01,0x2a, 0x00,0xa3, 0x00,0xcb, 0x00,0xb1, 0x00,0x52, 
		0x00,0xbb, 0x00,0xee, 0x00,0xcf, 0x00,0xe2, 0x00,0xa7, 0x00,0x41, 0x00,0x86, 0x00,0x7f, 0x00,0xa3, 0x00,0x46, 0x00,0xe8, 0x00,0x2a, 0x00,0x02, 0x00,0xf6, 0x00,0x35, 0x00,0x1e, 
		0x00,0x18, 0x00,0xf2, 0x01,0x1d, 0x00,0xd0, 0x00,0x38, 0x00,0x37, 0x01,0x02, 0x00,0x0e, 0x01,0x2c, 0x00,0x0e, 0x00,0x20, 0x00,0xc1, 0x00,0x0e, 0x00,0xe8, 0x00,0x41, 0x00,0xbc, 
		0x00,0xd5, 0x00,0x3b, 0x00,0x4b, 0x00,0x5d, 0x00,0x96, 0x00,0x2e, 0x00,0xfe, 0x00,0x63, 0x00,0xa9, 0x00,0xff, 0x00,0x24, 0x00,0x97, 0x00,0x73, 0x00,0x54, 0x01,0x17, 0x01,0x13, 
		0x00,0xe0, 0x00,0x18, 0x00,0xd7, 0x00,0x70, 0x00,0x4e, 0x01,0x2b, 0x00,0x57, 0x00,0x81, 0x00,0xe5, 0x00,0x7f, 0x00,0xb2, 0x00,0xe5, 0x00,0x5c, 0x00,0x01, 0x00,0xd5, 0x00,0x75, 
		0x01,0x3b, 0x00,0x6e, 0x00,0x5e, 0x01,0x0b, 0x00,0x37, 0x00,0x8f, 0x00,0x8e, 0x01,0x2f, 0x00,0x79, 0x00,0xec, 0x01,0x29, 0x00,0xf7, 0x01,0x3d, 0x00,0xc2, 0x00,0xe1, 0x00,0x10, 
		0x00,0x33, 0x00,0x8d, 0x01,0x38, 0x01,0x01, 0x00,0x28, 0x00,0xe3, 0x00,0xa1, 0x00,0x5d, 0x00,0x02, 0x00,0x85, 0x00,0x68, 0x01,0x27, 0x00,0xb4, 0x00,0x67, 0x00,0xb8, 0x01,0x30, 
		0x00,0x71, 0x00,0x6b, 0x01,0x0c, 0x01,0x14, 0x00,0x09, 0x00,0xa0, 0x01,0x20, 0x01,0x3d, 0x01,0x31, 0x00,0x86, 0x00,0xef, 0x00,0x3b, 0x00,0x81, 0x00,0xd5, 0x01,0x0b, 0x00,0x90, 
		0x00,0xa2, 0x00,0x89, 0x00,0x46, 0x00,0x4f, 0x00,0x72, 0x00,0xd8, 0x01,0x02, 0x00,0xaa, 0x00,0xf4, 0x00,0xa2, 0x00,0xfc, 0x00,0x3a, 0x00,0x8a, 0x01,0x0d, 0x00,0x5a, 0x01,0x1b, 
		0x00,0x48, 0x01,0x2e, 0x01,0x1f, 0x00,0xd8, 0x00,0xa6, 0x00,0x90, 0x00,0x95, 0x00,0x85, 0x00,0xac, 0x00,0xbc, 0x00,0x67, 0x01,0x39, 0x01,0x14, 0x00,0xf4, 0x00,0x91, 0x01,0x1c, 
		0x00,0xb6, 0x00,0xf3, 0x01,0x1f, 0x00,0x52, 0x00,0xc8, 0x01,0x1a, 0x01,0x14, 0x00,0xf5, 0x00,0x5e, 0x00,0x7b, 0x00,0x34, 0x01,0x09, 0x01,0x3a, 0x00,0x38, 0x00,0x87, 0x01,0x0e, 
		0x00,0x44, 0x00,0x40, 0x00,0x9d, 0x00,0xa5, 0x00,0x33, 0x00,0x6e, 0x00,0x09, 0x00,0x34, 0x00,0x3c, 0x00,0x0e, 0x00,0x1c, 0x00,0xc9, 0x00,0x0f, 0x00,0x8e, 0x00,0xbe, 0x00,0x78, 
		0x00,0x6c, 0x00,0x8c, 0x01,0x11, 0x00,0xd8, 0x00,0xf2, 0x00,0x61, 0x00,0x7f, 0x00,0xc6, 0x00,0x5b, 0x00,0x97, 0x01,0x28, 0x00,0x08, 0x00,0x75, 0x00,0xee, 0x00,0x33, 0x00,0x47, 
		0x01,0x28, 0x00,0x9c, 0x00,0x7b, 0x01,0x0b, 0x00,0x92, 0x00,0x91, 0x01,0x2a, 0x00,0xd6, 0x01,0x38, 0x00,0x91, 0x00,0x85, 0x00,0x83, 0x00,0x11, 0x00,0x3f, 0x00,0xcf, 0x00,0x8b, 
		0x00,0x78, 0x00,0xa6, 0x00,0x65, 0x00,0xa4, 0x01,0x23, 0x00,0x71, 0x01,0x01, 0x00,0xd8, 0x00,0x6c, 0x00,0x62, 0x01,0x2c, 0x00,0xf4, 0x00,0xe3, 0x00,0x20, 0x00,0x82, 0x00,0x13, 
		0x00,0xc2, 0x00,0xc2, 0x00,0x74, 0x00,0xa0, 0x01,0x3f, 0x00,0x13, 0x00,0xe6, 0x00,0xec, 0x00,0x09, 0x00,0xf9, 0x01,0x04, 0x01,0x09, 0x00,0x75, 0x00,0xba, 0x00,0x0a, 0x00,0xc3, 
		0x00,0x36, 0x01,0x0b, 0x00,0x0b, 0x00,0x73, 0x00,0xba, 0x01,0x20, 0x00,0x00, 0x00,0xec, 0x00,0x4d, 0x00,0xfe, 0x00,0x0c, 0x00,0xb3, 0x01,0x2c, 0x00,0x12, 0x01,0x1d, 0x01,0x1f, 
		0x00,0x00, 0x00,0xce, 0x01,0x2e, 0x00,0xb4, 0x00,0xe7, 0x00,0x4d, 0x01,0x21, 0x00,0xf9, 0x01,0x38, 0x01,0x33, 0x00,0xc1, 0x00,0x08, 0x00,0xb7, 0x01,0x2a, 0x00,0xa6, 0x00,0x28, 
		0x01,0x2e, 0x00,0x2e, 0x00,0x9c, 0x00,0x8c, 0x00,0x66, 0x00,0x4e, 0x01,0x3b, 0x00,0x85, 0x00,0xde, 0x00,0x0e, 0x00,0x30, 0x00,0x08, 0x01,0x1b, 0x00,0xae, 0x01,0x18, 0x00,0x50, 
		0x00,0xc6, 0x00,0xb8, 0x01,0x3f, 0x00,0x01, 0x00,0xd1, 0x00,0x81, 0x00,0x96, 0x00,0x05, 0x00,0xb8, 0x00,0x38, 0x00,0xf6, 0x00,0x55, 0x00,0xd3, 0x00,0x9d, 0x00,0xa4, 0x00,0x84, 
		0x01,0x2b, 0x00,0x68, 0x00,0x34, 0x01,0x14, 0x00,0x73, 0x00,0x65, 0x00,0x01, 0x00,0xab, 0x00,0x49, 0x00,0x7e, 0x00,0x9f, 0x00,0x8d, 0x00,0x30, 0x00,0xb8, 0x01,0x2a, 0x01,0x28, 
		0x00,0x7c, 0x01,0x07, 0x00,0x58, 0x00,0x2e, 0x00,0xb6, 0x00,0x89, 0x00,0xc0, 0x00,0x3e, 0x01,0x3d, 0x00,0x2d, 0x00,0x5c, 0x00,0x5c, 0x00,0x72, 0x00,0xdf, 0x00,0xf0, 0x00,0xd9, 
		0x01,0x16, 0x00,0x4d, 0x00,0x53, 0x00,0x6f, 0x00,0xe7, 0x00,0x84, 0x00,0x73, 0x01,0x2e, 0x01,0x25, 0x01,0x0f, 0x01,0x15, 0x00,0x0e, 0x00,0xb3, 0x00,0xd4, 0x01,0x17, 0x01,0x12, 
		0x01,0x15, 0x00,0xce, 0x00,0x86, 0x00,0x95, 0x00,0x49, 0x00,0x1d, 0x00,0x35, 0x00,0x06, 0x00,0xb2, 0x01,0x3c, 0x00,0x0c, 0x00,0x9e, 0x01,0x3e, 0x00,0xb5, 0x01,0x22, 0x00,0x8e, 
		0x00,0xca, 0x01,0x3e, 0x00,0xba, 0x01,0x2b, 0x00,0xca, 0x00,0xfe, 0x00,0xcf, 0x01,0x2f, 0x00,0xc0, 0x00,0xf7, 0x00,0xdf, 0x00,0x19, 0x00,0x9a, 0x00,0xa7, 0x00,0x75, 0x01,0x33, 
		0x01,0x1d, 0x00,0x2c, 0x01,0x21, 0x00,0x59, 0x00,0x03, 0x00,0x67, 0x00,0x25, 0x00,0xe6, 0x00,0x54, 0x01,0x0c, 0x00,0xe5, 0x00,0x19, 0x01,0x2a, 0x00,0xe7, 0x00,0xe5, 0x00,0xc9, 
		0x01,0x15, 0x00,0x67, 0x00,0xe1, 0x00,0xeb, 0x00,0x0e, 0x00,0xb1, 0x00,0x7c, 0x00,0x8c, 0x01,0x1e, 0x00,0x89, 0x00,0xcc, 0x00,0x9b, 0x00,0xf3, 0x00,0xf7, 0x00,0xdb, 0x00,0xae, 
		0x00,0xf4, 0x00,0xbc, 0x00,0x03, 0x00,0xd7, 0x00,0x29, 0x00,0xa2, 0x00,0x89, 0x00,0xef, 0x00,0x43, 0x00,0xeb, 0x00,0xc9, 0x00,0x0e, 0x01,0x0d, 0x01,0x06, 0x00,0x59, 0x00,0xb8, 
		0x00,0xce, 0x00,0xf4, 0x00,0x53, 0x00,0xdc, 0x00,0x50, 0x00,0xd0, 0x00,0xc5, 0x00,0x74, 0x00,0xc2, 0x00,0xf3, 0x00,0xf0, 0x00,0x2b, 0x00,0x5e, 0x00,0x4c, 0x00,0xde, 0x00,0x15, 
		0x00,0x2e, 0x00,0xac, 0x01,0x3d, 0x00,0xa0, 0x00,0xb4, 0x00,0x8d, 0x00,0xe1, 0x00,0x8f, 0x00,0x34, 0x00,0x3c, 0x01,0x2f, 0x01,0x36, 0x01,0x13, 0x00,0x52, 0x00,0x41, 0x00,0x01, 
		0x00,0x3b, 0x00,0x5d, 0x00,0x2b, 0x00,0xac, 0x00,0x3a, 0x00,0x3f, 0x01,0x30, 0x00,0xeb, 0x01,0x07, 0x00,0xb3, 0x00,0x87, 0x01,0x1a, 0x00,0xed, 0x00,0x61, 0x00,0x33, 0x00,0x41, 
		0x00,0xfc, 0x00,0x4a, 0x00,0x07, 0x00,0xca, 0x00,0xd9, 0x00,0x66, 0x00,0x98, 0x01,0x3f, 0x00,0xfc, 0x00,0x5d, 0x00,0x3b, 0x00,0x1c, 0x01,0x39, 0x01,0x38, 0x01,0x07, 0x00,0x50, 
		0x00,0x96, 0x00,0x4e, 0x00,0x18, 0x00,0x74, 0x01,0x14, 0x01,0x29, 0x00,0xe6, 0x00,0x3e, 0x00,0x3f, 0x00,0x77, 0x00,0xa0, 0x00,0x8b, 0x00,0x68, 0x00,0x4e, 0x00,0xd8, 0x00,0x40, 
		0x00,0xeb, 0x01,0x17, 0x00,0xcc, 0x00,0x9f, 0x00,0x0d, 0x01,0x0b, 0x00,0x10, 0x00,0x00, 0x01,0x34, 0x00,0x67, 0x00,0x4b, 0x00,0x4e, 0x00,0x79, 0x00,0xa4, 0x00,0x17, 0x01,0x00, 
		0x00,0xba, 0x00,0x9e, 0x00,0xe1, 0x00,0xf8, 0x00,0x3c, 0x00,0xc0, 0x00,0xe1, 0x00,0x1b, 0x00,0xdf, 0x00,0x5a, 0x00,0x2d, 0x00,0x76, 0x00,0xc7, 0x00,0x19, 0x00,0xa9, 0x00,0x23, 
		0x00,0xc1, 0x01,0x2c, 0x00,0x63, 0x00,0xcc, 0x01,0x05, 0x01,0x25, 0x00,0xb0, 0x00,0xdc, 0x01,0x38, 0x01,0x07, 0x00,0x24, 0x00,0xff, 0x00,0x23, 0x00,0x70, 0x00,0x8b, 0x00,0x7f, 
		0x00,0x54, 0x00,0xb4, 0x00,0x2e, 0x00,0xb7, 0x01,0x11, 0x00,0x50, 0x01,0x0a, 0x00,0xfe, 0x00,0xd7, 0x01,0x2f, 0x00,0x53, 0x00,0x3b, 0x00,0x62, 0x00,0x3a, 0x01,0x14, 0x00,0x05, 
		0x00,0xe8, 0x01,0x13, 0x00,0x1a, 0x00,0xb2, 0x01,0x34, 0x00,0x73, 0x00,0x38, 0x01,0x35, 0x00,0x2d, 0x00,0x44, 0x01,0x21, 0x00,0xb9, 0x00,0xda, 0x00,0x95, 0x00,0xe3, 0x00,0x87, 
		0x00,0xec, 0x00,0xd6, 0x00,0x48, 0x00,0xe5, 0x00,0xf7, 0x00,0x02, 0x00,0x2d, 0x00,0x7a, 0x00,0x6e, 0x00,0x85, 0x00,0x0e, 0x00,0xa6, 0x00,0x3f, 0x00,0x5a, 0x00,0xff, 0x00,0x6f, 
		0x00,0x45, 0x00,0xc3, 0x00,0xf1, 0x01,0x12, 0x00,0x77, 0x00,0x76, 0x01,0x07, 0x00,0x85, 0x01,0x0d, 0x00,0x43, 0x00,0x57, 0x00,0xc7, 0x01,0x34, 0x00,0xf6, 0x00,0xf3, 0x01,0x30, 
		0x00,0x5a, 0x00,0x21, 0x00,0xc8, 0x00,0xd5, 0x00,0x2d, 0x00,0x79, 0x00,0xa0, 0x00,0x5d, 0x01,0x1c, 0x00,0x88, 0x00,0x20, 0x00,0x5d, 0x00,0xcc, 0x00,0x73, 0x00,0x67, 0x00,0x69, 
		0x00,0xe5, 0x01,0x29, 0x00,0x5a, 0x00,0x8c, 0x00,0xf9, 0x00,0xb1, 0x01,0x38, 0x00,0x74, 0x00,0x7e, 0x00,0x2e, 0x01,0x0d, 0x00,0xf0, 0x00,0xfe, 0x00,0x90, 0x00,0xa3, 0x00,0x1d, 
		0x00,0xe2, 0x01,0x2a, 0x00,0x82, 0x00,0x40, 0x00,0x34, 0x00,0x99, 0x00,0x03, 0x00,0xab, 0x00,0x05, 0x00,0x8a, 0x00,0x51, 0x00,0x53, 0x00,0x10, 0x00,0x8c, 0x00,0xc5, 0x00,0x73, 
		0x00,0xc1, 0x01,0x3a, 0x01,0x3f, 0x01,0x31, 0x01,0x10, 0x01,0x19, 0x00,0xea, 0x00,0x08, 0x00,0x3b, 0x00,0x5d, 0x00,0x53, 0x00,0x9d, 0x01,0x34, 0x00,0x97, 0x00,0x0f, 0x00,0x2c, 
		0x00,0x29, 0x00,0xa5, 0x00,0x9d, 0x00,0xf7, 0x01,0x2c, 0x00,0x10, 0x01,0x25, 0x00,0x7b, 0x01,0x14, 0x00,0x5b, 0x01,0x35, 0x00,0xa1, 0x00,0x66, 0x00,0x74, 0x00,0xa7, 0x00,0xc5, 
		0x00,0x08, 0x00,0xe6, 0x00,0xa1, 0x00,0xc6, 0x00,0x89, 0x01,0x27, 0x00,0x96, 0x00,0x68, 0x00,0x99, 0x00,0x6d, 0x00,0xc0, 0x01,0x0b, 0x00,0x73, 0x00,0xd2, 0x00,0x89, 0x00,0x8e, 
		0x00,0x11, 0x00,0xa3, 0x00,0x91, 0x00,0xa4, 0x00,0xcd, 0x00,0x3d, 0x00,0xb3, 0x00,0x12, 0x00,0x7c, 0x00,0x6e, 0x00,0xd7, 0x01,0x0c, 0x00,0xe2, 0x00,0x8c, 0x00,0x95, 0x00,0x12, 
		0x00,0x92, 0x00,0x9d, 0x00,0x5e, 0x00,0xdd, 0x00,0x0e, 0x00,0x0d, 0x01,0x39, 0x00,0x96, 0x00,0xfc, 0x00,0xf0, 0x00,0x59, 0x01,0x2b, 0x00,0x29, 0x00,0x40, 0x00,0x10, 0x00,0xd7, 
		0x01,0x1a, 0x00,0xfd, 0x00,0xf4, 0x01,0x1e, 0x00,0xd6, 0x00,0x3c, 0x00,0x47, 0x01,0x32, 0x00,0x50, 0x00,0x84, 0x00,0xae, 0x00,0xda, 0x00,0xa5, 0x00,0x31, 0x00,0x7f, 0x00,0x42, 
		0x01,0x01, 0x00,0x73, 0x01,0x2f, 0x00,0xc7, 0x00,0xd2, 0x00,0x52, 0x00,0x6e, 0x01,0x15, 0x00,0x06, 0x01,0x25, 0x00,0xcf, 0x01,0x29, 0x00,0x3a, 0x00,0x90, 0x00,0x47, 0x00,0xe8, 
		0x00,0x58, 0x00,0x30, 0x00,0x8e, 0x00,0xf2, 0x00,0x29, 0x00,0x47, 0x00,0x87, 0x01,0x1f, 0x00,0x78, 0x00,0x63, 0x00,0x4b, 0x00,0xeb, 0x00,0xf4, 0x00,0xa6, 0x00,0x5d, 0x00,0xaa, 
		0x01,0x0f, 0x00,0xa4, 0x00,0x2a, 0x01,0x0d, 0x00,0xf0, 0x00,0x43, 0x01,0x2b, 0x00,0x29, 0x00,0x31, 0x01,0x01, 0x01,0x1c, 0x01,0x1f, 0x00,0x9b, 0x00,0x31, 0x00,0x4b, 0x01,0x0b, 
		0x01,0x00, 0x01,0x38, 0x00,0x24, 0x00,0xcf, 0x01,0x2a, 0x00,0xa1, 0x00,0x4a, 0x01,0x17, 0x01,0x16, 0x01,0x13, 0x00,0xda, 0x00,0xa5, 0x00,0x38, 0x00,0x0a, 0x00,0x98, 0x00,0x45, 
		0x00,0xc4, 0x01,0x0e, 0x00,0x1e, 0x00,0xc4, 0x01,0x29, 0x00,0x56, 0x00,0x70, 0x00,0xba, 0x00,0x31, 0x00,0xd0, 0x01,0x35, 0x00,0x8f, 0x00,0x31, 0x00,0x56, 0x00,0x3a, 0x00,0xd3, 
		0x01,0x20, 0x00,0x77, 0x00,0xae, 0x01,0x18, 0x01,0x04, 0x00,0x0a, 0x00,0x22, 0x00,0x83, 0x00,0xd6, 0x00,0x4f, 0x00,0xfb, 0x00,0x36, 0x01,0x3d, 0x00,0xe5, 0x00,0x05, 0x01,0x01, 
		0x00,0xca, 0x00,0x2c, 0x01,0x21, 0x00,0x47, 0x00,0xab, 0x00,0xae, 0x00,0xe1, 0x01,0x2e, 0x01,0x1c, 0x00,0x7b, 0x00,0x14, 0x00,0x6c, 0x01,0x32, 0x00,0xc8, 0x01,0x2f, 0x00,0xbf, 
		0x00,0x0b, 0x00,0x9d, 0x00,0x0f, 0x00,0x1f, 0x00,0xde, 0x00,0xcb, 0x00,0xd7, 0x00,0xb0, 0x00,0x81, 0x00,0x62, 0x00,0x35, 0x00,0xfb, 0x00,0x92, 0x01,0x0d, 0x00,0xc8, 0x00,0x9b, 
		0x00,0xe6, 0x00,0xbd, 0x00,0x35, 0x00,0xf4, 0x00,0x48, 0x00,0x18, 0x01,0x1d, 0x00,0xb0, 0x00,0x45, 0x00,0xc5, 0x00,0xea, 0x00,0x56, 0x01,0x1a, 0x00,0x45, 0x00,0xf1, 0x00,0x4f, 
		0x00,0x3b, 0x01,0x09, 0x00,0x4b, 0x00,0xac, 0x00,0xc3, 0x01,0x1d, 0x00,0x8a, 0x01,0x2a, 0x00,0x33, 0x00,0x04, 0x00,0x72, 0x00,0x27, 0x00,0xa0, 0x00,0x4b, 0x00,0x23, 0x01,0x26, 
		0x00,0xa7, 0x00,0xea, 0x01,0x1c, 0x00,0x5c, 0x00,0x2a, 0x01,0x0f, 0x00,0xad, 0x01,0x28, 0x00,0xae, 0x00,0xad, 0x00,0x5f, 0x00,0x5e, 0x00,0x2d, 0x00,0x27, 0x00,0x92, 0x00,0x90, 
		0x00,0x79, 0x01,0x04, 0x01,0x07, 0x00,0x57, 0x00,0x43, 0x00,0x22, 0x00,0x8e, 0x00,0x41, 0x00,0xdb, 0x00,0x07, 0x00,0xa9, 0x00,0xfd, 0x00,0x16, 0x00,0xf7, 0x00,0x87, 0x00,0x74, 
		0x01,0x3b, 0x01,0x36, 0x00,0xb3, 0x00,0x1b, 0x01,0x3d, 0x00,0x06, 0x00,0xa9, 0x00,0x85, 0x00,0x79, 0x00,0xbb, 0x00,0x86, 0x00,0xf5, 0x00,0xf6, 0x01,0x0b, 0x00,0x7d, 0x00,0x3a, 
		0x01,0x11, 0x00,0xd1, 0x00,0x03, 0x01,0x10, 0x00,0x2e, 0x00,0x6c, 0x00,0x07, 0x00,0x7a, 0x01,0x11, 0x00,0x49, 0x00,0x10, 0x00,0x8b, 0x00,0xde, 0x00,0x22, 0x00,0xd8, 0x00,0x18, 
		0x00,0xaf, 0x00,0x4e, 0x00,0x5f, 0x00,0xaf, 0x00,0xc6, 0x00,0xa8, 0x00,0x27, 0x00,0xa1, 0x00,0x88, 0x00,0xc3, 0x00,0x4b, 0x01,0x2a, 0x01,0x16, 0x00,0xbb, 0x00,0x8e, 0x00,0xcc, 
		0x00,0x68, 0x01,0x0e, 0x00,0x45, 0x00,0x93, 0x00,0xc6, 0x00,0xe0, 0x00,0x49, 0x00,0x15, 0x00,0xcf, 0x00,0x85, 0x01,0x28, 0x00,0x40, 0x00,0x35, 0x01,0x25, 0x00,0x1e, 0x00,0x08, 
		0x01,0x3f, 0x00,0xdf, 0x00,0xf7, 0x01,0x17, 0x00,0xc8, 0x01,0x0b, 0x00,0x97, 0x00,0xa7, 0x00,0x91, 0x01,0x24, 0x00,0x6f, 0x00,0x22, 0x00,0xf7, 0x00,0xb2, 0x00,0xa3, 0x00,0x4c, 
		0x00,0x9c, 0x00,0x03, 0x01,0x22, 0x01,0x21, 0x00,0xb8, 0x00,0x87, 0x00,0xc8, 0x00,0xc8, 0x00,0x8f, 0x01,0x03, 0x00,0x72, 0x00,0x74, 0x00,0xf5, 0x01,0x3b, 0x00,0x19, 0x01,0x07, 
		0x01,0x31, 0x00,0xe8, 0x01,0x00, 0x01,0x2a, 0x00,0xa1, 0x00,0x72, 0x00,0x39, 0x00,0x4f, 0x00,0x73, 0x00,0x9c, 0x00,0x00, 0x00,0xbe, 0x01,0x15, 0x00,0x1a, 0x00,0xbc, 0x00,0xe6, 
		0x01,0x0a, 0x00,0x70, 0x01,0x04, 0x00,0x9b, 0x00,0x49, 0x00,0x80,
	}	

	a = []byte("abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	assert.Equal(310, len(a))
	err = secureShuffleBytes(a, src)
	assert.Nil(err)
	expect := "ymQiZwbuqOHULwYjzvxCWl3tTfBzjaSY0GUdkj0CfP2M05SQybRJWV8YAhBZwxLRoeEOPqVtINKfUgJH4bTThYh0plnokeB7bzQIFXALmNn5iKea8zYCltDaX4rN9ifuUrMdHTZxnArqR6s6349vIgnrfhWOESGyg2lt8yK4275AVkMHd8PwCGg20kXT1wISqsyJijumSaJUHOzn3teVEpbmQR1dxKDj9FmMkusIQ2FhoW5pvxEaVXP6qouXvFcpvc6pMDG7Ko9EN83cZL9173licNeA761GWsFgZBsJPDORCrB5d4c1LD"
	assert.Equal(expect, string(a))
	//The above result was verified with a simple python program.
}

func TestCreateCard(t *testing.T) {
	seed := make([]byte, sha256.Size)
	seed[0] = 1
	seed[15] = 127
	seed[31] = 255
	
	card, err := CreateCard(seed, 4, 3, "Z")
	if err != nil {
		t.Error(err)
		return
	}	
	
	t.Log(card)
}

func TestBcryptThread(t *testing.T) {
	pass := []byte("SuperSecretPassword");
	salt := []byte{0x71,0xd7,0x9f,0x82,0x18,0xa3,0x92,0x59,0xa7,0xa2,0x9a,0xab,0xb2,0xdb,0xaf,0xc3};  //"abcdefghijklmnopqrstuu" as bcrypt-base64
	resultChan := make(chan *thread_result);
	go bcryptThread(pass, salt, 123, resultChan);

	tr := <-resultChan

	//this hash was generated with PHP's password_hash() function (prefix and salt removed)
	expect := "knzXDUqgULdKteKc82qv7Ng4eidGTQW"

	if tr.err != nil {
		t.Error(tr.err);
	} else if string(tr.bcryptHash) != expect {
		t.Error("Wrong hash: ", string(tr.bcryptHash), "  Did you change the cost?");
	}
}

func TestHashCardLockPassword(t *testing.T) {
	hash, err := HashCardLockPassword([]byte("SuperSecretPassword"))
	if err != nil {
		t.Error(err);
		return;
	}
	
	got := hex.EncodeToString(hash);
	expect := "22e73674182a1d306fb0bdf79988557c9b20410040d0521461aab3897b729535";
	if got != expect {
		t.Error("Wrong hash: ", got);
	}
}

//A condensed version of HashCardLockPassword which does not use threads for acceleration
func singleCoreHashCardLockPassword(plaintextPassword []byte) ([]byte, error) {
	var sha = sha256.New()
	sha.Write(plaintextPassword)
	passwordShadow := sha.Sum(nil)
	
	salts := getThreadSalts()
	
	keys := [NumBcryptThreads][]byte{}
	for i, salt := range salts {
		keys[i] = hmacSha256(passwordShadow, salt)
	}
	
	resultChan := make(chan *thread_result, 1)
	all := make([]byte, 0)
	for i := range keys {
		bcryptThread(keys[i], salts[i], i, resultChan)
		res := <-resultChan
		if res.err != nil {
			return nil, res.err
		}
		if res.threadIndex != i {
			return nil, errors.New("bad threadIndex")
		}
		
		all = append(all, res.bcryptHash...)
	}
	
	return hmacSha256(passwordShadow, all), nil
}



//Test for possible threading problems
func TestHashCardLockPasswordSingleCore(t *testing.T) {
	hash, err := singleCoreHashCardLockPassword([]byte("SuperSecretPassword"))
	if err != nil {
		t.Error(err);
		return;
	}
	
	got := hex.EncodeToString(hash);
	//should have same output as TestHashCardLockPassword
	expect := "22e73674182a1d306fb0bdf79988557c9b20410040d0521461aab3897b729535";
	if got != expect {
		t.Error("Wrong hash: ", got);
	}
}
