package calcpass

import (
	"testing"
	"github.com/stretchr/testify/assert"
	"encoding/hex"
)

func Test_MakeKey32(t *testing.T) {
	assert := assert.New(t)

	seed := makeTestSeed()

	key32 := seed.MakeKey32()

	const expect = "0102030405060708090a0b0c0d0e0f100102030405060708090a0b0c0d0e0f10"
	assert.Equal(expect, hex.EncodeToString(key32))
}


func Test_CalculatePassword(t *testing.T) {
	assert := assert.New(t)

	seed := makeTestSeed()

	p, err := seed.CalculatePassword("example.com", 0)
	assert.Nil(err)
	assert.Equal(9, len(p))
	assert.Equal("Wdszebar0", p)

	//change revision
	p, err = seed.CalculatePassword("example.com", 1)
	assert.Nil(err)
	assert.Equal("Htxfwgrh5", p)

	//change 1 character of site name	
	p, err = seed.CalculatePassword("examplf.com", 1)
	assert.Nil(err)
	assert.Equal("Aqlkcprv3", p)

	//Change to 12 characters
	seed.DefaultPasswordFormat = PassFmt_Friendly12
	p, err = seed.CalculatePassword("example.com", 0)
	assert.Nil(err)
	assert.Equal(12, len(p))
	assert.Equal("Wdszebarkpq4", p)
}
