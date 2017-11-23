package bytewords

import (
	"testing"
	"github.com/stretchr/testify/assert"
)

func Test_Basic(t *testing.T) {
	assert := assert.New(t)

	encoder := NewEncoder()

	input := []byte("Hello World!")
	words := encoder.EncodeToString(input)
	assert.Equal("fog ice joy\njoy kid bus\nhen kid lap\njoy hut bit\n", words)

	decoder := NewDecoder()
	res, err := decoder.DecodeString(words)
	assert.Nil(err)
	assert.Equal(input, res)

	//
	// Decoding errors
	//

	//Word number 2 is too short
	_, err = decoder.DecodeString("fog ic joy")
	assert.NotNil(err)
	
	//Word number 2 is too long
	_, err = decoder.DecodeString("fog icee joy")
	assert.NotNil(err)
	
	//"bee" is not a recognized word
	_, err = decoder.DecodeString("fog bee joy")
	assert.NotNil(err)
	
}

//Encode and decode all byte values
func Test_All(t *testing.T) {
	assert := assert.New(t)
	
	input := make([]byte, 256)
	for i := 0; i < 256; i++ {
		input[i] = byte(i)
	}

	encoder := NewEncoder()

	words := encoder.EncodeToString(input)


	decoder := NewDecoder()
	res, err := decoder.DecodeString(words)
	assert.Nil(err)
	assert.Equal(input, res)
}
