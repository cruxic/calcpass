package calcpass

import (
	"testing"
	"github.com/stretchr/testify/assert"
)

func Test_CalcPass_2017a(t *testing.T) {
	assert := assert.New(t)

	pass, err := CalcPass_2017a([]byte("password"), []byte("abcdefgh"), "google.com", 0)
	if !assert.Nil(err) {
		return
	}

	t.Log("TODO: finish Test_CalcPass_2017a", len(pass))

	//assert.Equal([]byte("foo"), string(pass))
}

/*

func TestConcatAll(t *testing.T) {
	assert := assert.New(t)

	slices := [][]byte{
		[]byte{1,2,3},
		[]byte{4,5,6,7},
		[]byte{8,9},
	}
	
	res := concatAll(slices)
	assert.Equal("010203040506070809", hex.EncodeToString(res))
}
*/

/*

func TestGetKeyForWebsite(t *testing.T) {
	assert := assert.New(t)

	passHash := make([]byte, sha256.Size)
	passHash[0] = 1
	passHash[15] = 127
	passHash[31] = 255
	
	res1 := hex.EncodeToString(GetKeyForWebsite(passHash, "ExAmPlE.CoM", "A", 0))	
	res2 := hex.EncodeToString(hmacSha256(passHash, []byte("a0example.com")))

	assert.Equal(res1, res2)
	assert.Equal("40e6c356472da457af893f662e070164e65142456932cb42e04811b0f5e003d6", res1)

	//Change in revision gives completely different hash
	res3 := hex.EncodeToString(GetKeyForWebsite(passHash, "example.com", "A", 1))
	assert.Equal("c066f311170df52891a55dbc857b98bdb42df03c49684dd91df3a1c1a387c3cf", res3)
}
*/


/*
//Write a PPM image file
func writePPMImage(fname string, imgW, imgH int, pixels []byte) {
	//sanity
	if len(pixels) != imgW * imgH * 3 {
		panic("writePPMImage: bad argument")
	}

	fout, err := os.Create(fname)
	if err != nil {
		fmt.Println(err)
		return
	}
		
	fmt.Fprintf(fout, "P6\n%d %d\n255\n", imgW, imgH)
	fout.Write(pixels)
	fout.Close()
}

func writeGrayPPMImage(fname string, imgW, imgH int, grayValues []byte) {
	rgb := make([]byte, len(grayValues) * 3)

	j := 0
	for _, val := range grayValues {
		rgb[j] = val
		rgb[j+1] = val
		rgb[j+2] = val
		j += 3
	}

	writePPMImage(fname, imgW, imgH, rgb)
}*/
