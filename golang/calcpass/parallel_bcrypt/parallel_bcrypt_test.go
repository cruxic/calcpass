package parallel_bcrypt

import (
	"testing"
	"encoding/hex"
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
)


func Test_bcrypt(t *testing.T) {
	assert := assert.New(t)

	salt := []byte{0x71,0xd7,0x9f,0x82,0x18,0xa3,0x92,0x59,0xa7,0xa2,0x9a,0xab,0xb2,0xdb,0xaf,0xc3};  //"abcdefghijklmnopqrstuu" as bcrypt-base64

	//parallel_bcrypt avoids sending 0x00 bytes to bcrypt because some
	// implementations truncate upon the first null byte! (eg PHP)

	//Verify that bcrypt can handle non-printable bytes
	pass := []byte{0x01,0x02,0x03,0x7f,0x80,0x81,0xAB,0xCD,0xef,0xff}
	hash, err := bcrypt.GenerateFromPasswordAndSalt(pass, salt, 5)
	assert.Nil(err)
	assert.Equal("$2a$05$abcdefghijklmnopqrstuuu18bGopDo9r1tDNZl2p2xd1YzcTrTp6", string(hash))


	//parallel_bcrypt sends up to 64 bytes to bcrypt.  Prove that the
	// implementation does not truncate it.
	pass64 := []byte("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	hash, err = bcrypt.GenerateFromPasswordAndSalt(pass64, salt, 5)
	assert.Nil(err)
	assert.Equal("$2a$05$abcdefghijklmnopqrstuusN64mi0Q3MHT4E2PLNsVMiw2Jh1hNE6", string(hash))

	pass64 = []byte("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab")
	hash, err = bcrypt.GenerateFromPasswordAndSalt(pass64, salt, 5)
	assert.Nil(err)
	assert.Equal("$2a$05$abcdefghijklmnopqrstuulBPHoU3/c65NkXOJMDkVnN3KklTvm1a", string(hash))

	//the above results were verified with PHP's bcrypt
}

func Test_bytesToHex(t *testing.T) {
	assert := assert.New(t)

	data := util.ByteSequence(0, 256)
	assert.Equal(hex.EncodeToString(data), string(bytesToHex(data)))
}


func Test_quad(t *testing.T) {
	assert := assert.New(t)

	salt := []byte{0x71,0xd7,0x9f,0x82,0x18,0xa3,0x92,0x59,0xa7,0xa2,0x9a,0xab,0xb2,0xdb,0xaf,0xc3};  //"abcdefghijklmnopqrstuu" as bcrypt-base64

	//this result was verified with PHP's bcrypt
	expect := "e9d2a6e99bf7f33f5b3857e27594723e161b48e06139500080333c6f2540c0a0"
	
	pass := []byte("Super Secret Password")
	hash, err := Hash(4, pass, salt, 5)
	assert.Nil(err)
	assert.Equal(expect,
		hex.EncodeToString(hash))
}

