/*
Import/Export the seed in a human friendly printable format.
*/
package calcpass


import (
	"testing"
	"encoding/base64"
	"github.com/stretchr/testify/assert"
	"github.com/cruxic/calcpass/golang/calcpass/util"
)

func makeTestSeed() *Seed {
	seed := &Seed{
		Name: "Test-Seed",
		DefaultPasswordFormat: PassFmt_Friendly9,
		HighValueKDFType: KDFType_QuadBcrypt12,		
	}

	copy(seed.Bytes[:], util.ByteSequence(1, 16))

	return seed 
}

func Test_Format0(t *testing.T) {
	assert := assert.New(t)

	seed := makeTestSeed()

	pass := []byte("Super Secret")
	exp, err := Format0_Export(seed, pass, KDFType_QuadBcrypt12)
	if err != nil {
		t.Error(err)
		return
	}

	assert.Equal(seed.Name, exp.SeedName)

	seed2, err := Format0_ImportPrinted(seed.Name, exp.ByteWordLines, pass)
	if err != nil {
		t.Error(err)
		return
	}

	assert.Equal(seed.Name, seed2.Name)
	assert.Equal(seed.Bytes[:], seed2.Bytes[:])
	assert.Equal(seed.DefaultPasswordFormat, seed2.DefaultPasswordFormat)
	assert.Equal(seed.HighValueKDFType, seed2.HighValueKDFType)


	//Decode again from QR data
	data, err := base64.StdEncoding.DecodeString(exp.Base64ForQRCode)
	assert.Nil(err)
	seed2, err = Format0_ImportRaw(data, pass)
	if err != nil {
		t.Error(err)
		return
	}

	assert.Equal(seed.Name, seed2.Name)
	assert.Equal(seed.Bytes[:], seed2.Bytes[:])
	assert.Equal(seed.DefaultPasswordFormat, seed2.DefaultPasswordFormat)
	assert.Equal(seed.HighValueKDFType, seed2.HighValueKDFType)
}

