package calcpass

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"github.com/cruxic/calcpass/golang/calcpass/bytewords"
)

const fmt0_pdat_len = 34

/*
Format 0:

	0    : FormatVer 0x00
	1    : encryptionKDFType
	2-9  : KDF-Salt
	--- Encrypted
	10-26: seed.Bytes (16 bytes)
	26   : seed.DefaultPasswordFormat
	27   : seed.HighValueKDFType
	--- End Encrypted
	28-N : Seed Name (Not included in printed bytewords)
	N-N+4: Inner MAC (HmacSha256 of all the above before encryption truncated to 4 bytes)
	N+4-N+6: Outer Checksum (sha256 truncated to 2 bytes)

*/
type Format0Exported struct {
	SeedName string
	ByteWordLines string

	/*The same data as base64 to be used to output a QR code.*/
	Base64ForQRCode string
	
}

func (self *Format0Exported) String() string {
	return fmt.Sprintf("%s\n-----------\n%s", self.SeedName, self.ByteWordLines)
}

func Format0_Export(seed *Seed, encryptionPassword []byte, encryptionKDFType KDFType) (*Format0Exported, error) {

	//64bits of random salt
	salt64 := make([]byte, 8)
	_, err := rand.Read(salt64)
	if err != nil {
		return nil, err
	}

	//Derive encryption key from password and salt.
	//This may take many seconds on older computers.
	salt128 := expandSalt(seed.Name, salt64)
	key, err := ExecKDF(encryptionKDFType, encryptionPassword, salt128)
	if err != nil {
		return nil, err
	}

	formatVer := byte(0)
	rawSeedName := []byte(seed.Name)

	dat := make([]byte, 0, 64)
	dat = append(dat, formatVer)
	dat = append(dat, byte(encryptionKDFType))
	dat = append(dat, salt64...)
	dat = append(dat, seed.Bytes[:]...)
	dat = append(dat, byte(seed.DefaultPasswordFormat))
	dat = append(dat, byte(seed.HighValueKDFType))
	dat = append(dat, rawSeedName...)

	//append MAC
	mac4 := util.HmacSha256(key, dat)[0:4]
	dat = append(dat, mac4...)

	//XOR encrypt
	for i := 10; i < 28; i++ {
		dat[i] ^= key[i-10]
	}

	//Outer checksum (detects typos)
	h := sha256.New()
	h.Write(dat)
	outer2 := h.Sum(nil)[0:2]
	dat = append(dat, outer2...)

	//Printed format (excludes seedName from the binary data)
	d := len(dat)
	pdat := make([]byte, 0, 64)
	pdat = append(pdat, dat[0:28]...)
	pdat = append(pdat, dat[d-6:]...)
	
	enc := bytewords.NewEncoder()
	enc.WordsPerLine = 3

	result := &Format0Exported{
		SeedName: seed.Name,
		ByteWordLines: enc.EncodeToString(pdat),
		Base64ForQRCode: base64.StdEncoding.EncodeToString(dat),
	}

	return result, nil
}

func Format0_ImportPrinted(seedName string, words string, encryptionPassword []byte) (*Seed, error) {

	//Decode the bytewords
	pdat, err := bytewords.NewDecoder().DecodeString(words)
	if err != nil {
		return nil, err
	}

	if len(pdat) != fmt0_pdat_len {
		return nil, errors.New(fmt.Sprintf("Expected exactly %d words", fmt0_pdat_len))
	}

	rawSeedName := []byte(seedName)

	//insert seed name before the MAC
	dat := make([]byte, 0, 64)
	dat = append(dat, pdat[0:28]...)
	dat = append(dat, rawSeedName...)
	dat = append(dat, pdat[28:]...)
	
	return Format0_ImportRaw(dat, encryptionPassword)
}

func Format0_ImportRaw(dat []byte, encryptionPassword []byte) (*Seed, error) {
	d := len(dat) 
	if d <= 29 {
		return nil, errors.New("Data too short for format 0")
	}

	if dat[0] != 0x00 {
		return nil, errors.New("Not format 0.")
	}

	//verify outer checksum
	h := sha256.New()
	h.Write(dat[0:d-2])
	chk1 := h.Sum(nil)[0:2]	
	chk2 := dat[d-2:]
	if subtle.ConstantTimeCompare(chk1, chk2) != 1 {
		return nil, errors.New("Checksum fail.  Typo?")
	}

	//Expand the salt
	seedName := string(dat[28:d-6])
	salt64 := dat[2:10]
	salt128 := expandSalt(seedName, salt64)

	//Derive decryption key
	encryptionKDFType := KDFType(dat[1])
	key, err := ExecKDF(encryptionKDFType, encryptionPassword, salt128)
	if err != nil {
		return nil, err
	}

	//XOR decrypt
	for i := 10; i < 28; i++ {
		dat[i] ^= key[i-10]
	}

	//Verify inner MAC
	chk1 = dat[d-6:d-2]
	chk2 = util.HmacSha256(key, dat[0:d-6])[0:4]
	if subtle.ConstantTimeCompare(chk1, chk2) != 1 {
		return nil, errors.New("Decryption failed.  Wrong password or corrupt data.")
	}

	seed := &Seed{
		Name: seedName,
		DefaultPasswordFormat: PassFmt(dat[26]),
		HighValueKDFType: KDFType(dat[27]),
	}

	copy(seed.Bytes[:], dat[10:27])

	return seed, nil		
}

func ImportFromQRCode(qrText string, encryptionPassword []byte) (*Seed, error) {
	data, err := base64.StdEncoding.DecodeString(qrText)
	if err != nil {
		return nil, errors.New("Invalid Base64 data from QR code")
	}

	if len(data) < 16 {
		return nil, errors.New("Data too short")
	}

	//First byte tells format
	formatVer := data[0]

	//Format0
	if formatVer == 0 {
		return Format0_ImportRaw(data, encryptionPassword)
	} else {
		return nil, errors.New(fmt.Sprintf("Unsupported format version 0x%02X", formatVer))
	}

}


/*
bcrypt requires 128bits of salt.  I will compromise because
users sometimes type it by hand when importing their printed seed.

Instead I'll use 64bits of random salt, (which is sufficient according
to RFC-2898), but I'll further add the seed name, which is usually a
word or a person's name.  I'll also add in some constant "data that explicitly
distinguishes between different operations" as suggested by RFC-2898.

All this gets hashed to expand it to 128bits.
*/
func expandSalt(seedName string, rand64bit []byte) []byte {
	if len(seedName) == 0 || len(rand64bit) != 8 {
		panic("illegal argument")
	}
	
	h := sha256.New()
	h.Write([]byte(seedName))
	h.Write(rand64bit)
	h.Write([]byte("calcpass-printed-seed"))
	d := h.Sum(nil)
	//truncate to 128bits
	return d[0:16]
}
