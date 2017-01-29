package calcpass

import (
	"testing"
	"encoding/hex"
	"errors"
	"fmt"
	"crypto/sha256"
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
			fmt.Println("Got err: ", err)
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



//
