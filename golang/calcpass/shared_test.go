package calcpass

import (
	"testing"
	"encoding/hex"
)

//Make sure I'm using hmac and sha256 correctly
func TestHmacSha256(t *testing.T) {
	//I created this test vector from an online tool
	hash := hex.EncodeToString(hmacSha256([]byte("SuperSecretPassword"), []byte("Hello World!")));
	expect := "ea6c66229109f1321b0088c42111069e9794c3aed574e837b6e87c6d14931aef"
	if hash != expect {
		t.Errorf("Got %s but expected %s", hash, expect)
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
	expect := "9e0cc11fdb46698b33f24ff792cc6ec5a1572e5d5ad5a63c6441bcd41c0d0b8f";
	if got != expect {
		t.Error("Wrong hash: %s", got);
	}
}

//
