package calcpass

import (
	"testing"
	"encoding/hex"
	"errors"
	"fmt"
	"crypto/sha256"
	"bytes"
)

/*type fixed_rand_source struct {
	index int
	values []int64
}

func (self *fixed_rand_source) Int63() int64 {
	v := self.values[self.index % len(self.values)];
	self.index++;
	return v;
}

func (self *fixed_rand_source) Seed(seed int64) {
	//just reset index
	//self.index = 0;
}*/

type fixed_byte_source struct {
	index int
	values []byte	
}

func (self *fixed_byte_source) NextByte() (byte, error) {
	if self.index >= len(self.values) {
		return 0, errors.New("END")
	}
	
	v := self.values[self.index];
	self.index++;
	
	return v, nil
}

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

/*func read_all_unbiased_rand_int8(src byte_source, n int) []int {
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

type rand_int8_func func (byte_source, int)(int,error)

func hasGoodDistribution(src byte_source, fn rand_int8_func, n int) bool {
	counts := make([]int, n)
	
	iterations := 3 * 256  //do at least 3 cycles of 0-255 from the byte_source
	
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

func bad_rand_int8(source byte_source, n int) (int, error) {
	b, err := source.NextByte();
	if err != nil {
		return -1, err;
	} else {
		return int(b) % n, nil
	}
}

func baseline_rand_int8(source byte_source, n int) (int, error) {
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

func TestGetSeedForWebsite(t *testing.T) {
	passHash := make([]byte, sha256.Size)
	passHash[0] = 1
	passHash[15] = 127
	passHash[31] = 255
	
	res1 := hex.EncodeToString(GetSeedForWebsite(passHash, "ExAmPlE.CoM", "a", 3))	
	res2 := hex.EncodeToString(hmacSha256(passHash, []byte("a3example.com")))
	
	if res1 != res2 {
		t.Errorf("%s != %s", res1, res2)
	}

	if res1 != "50ba3f6d12fe8e51641aaee2c2b7749fedc77c9fbe122bdbddf337ef32752fc0" {
		t.Error("Wrong output:", res1)
	}
}

func readManyFromByteSource(src byte_source, count int) ([]byte, error) {
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


func TestSha256ByteSource(t *testing.T) {
	seed := make([]byte, sha256.Size)
	seed[0] = 1
	seed[15] = 127
	seed[31] = 255
	
	expect1 := hmacSha256(seed, []byte{0})
	expect2 := hmacSha256(seed, []byte{1})
	expectLast := hmacSha256(seed, []byte{0xFF})

	src := newSha256ByteSource(seed)
	
	//seed has been copied so this has no effect
	seed[0]++
	
	got1, err := readManyFromByteSource(src, len(expect1))
	if !bytes.Equal(got1, expect1) || err != nil {
		t.Error("wrong hash or err")
		return
	}
	
	got2, err := readManyFromByteSource(src, len(expect1))
	if !bytes.Equal(got2, expect2) || err != nil {
		t.Error("wrong hash or err")
		return
	}
	
	if src.nBytesUsed != sha256.Size * 2 {
		t.Error("wrong nBytesUsed")
		return
	}
	
	//advance to last counter value
	src.counter = 0xFF
	got3, err := readManyFromByteSource(src, len(expect1))
	if !bytes.Equal(got3, expectLast) || err != nil {
		t.Error("wrong hash or err")
		return
	}
	
	//Cannot read any more bytes
	_, err = src.NextByte()
	if err == nil {
		t.Error("source did not end!")
	}
	
	//Test erase
	src = newSha256ByteSource(seed)
	src.NextByte()
	src.erase()
	_, err = src.NextByte()
	if err == nil || src.seed[0] != 0 || src.curHash[0] != 0 {
		t.Error("source erase failed.")
	}
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

	//Test against ascending byte_source
	
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

	expectXY := "2,11 1,8 8,12 2,15 0,13 12,11 1,11 2,14 0,12 3,4 7,16 2,15 5,14 4,10 0,2 4,4 5,3 2,0 0,1 11,3 "
	expectHuman := "3L 2I 9M 3P 1N 13L 2L 3O 1M 4E 8Q 3P 6O 5K 1C 5E 6D 3A 1B 12D "

	if rawXY != expectXY {
		t.Error(rawXY)
	}

	if human != expectHuman {
		t.Error(human)
	}
	
	/*
	here: use internal makeCoordinatesFromSource, passing a fixed source
	
	todo: is there a way to test the large scale randomness of the entire system?
	perhaps generate 100 seeds, each with an english password
	 and from each seed generate passwords for 100 websites*/
	

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
