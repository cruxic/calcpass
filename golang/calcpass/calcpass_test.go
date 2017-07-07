package calcpass

import (
	"testing"
	"github.com/stretchr/testify/assert"
//	"fmt"
	"strings"
	"crypto/sha256"
	"encoding/hex"
	//"github.com/cruxic/calcpass/golang/calcpass/util"

)

func Test_MakeFriendlyPassword12a(t *testing.T) {
	assert := assert.New(t)

	//seed too short
	pass, err := MakeFriendlyPassword12a(make([]byte, 31))
	assert.True(err != nil)

	seed := make([]byte, 32)  //all zeros
	pass, err = MakeFriendlyPassword12a(seed)
	assert.Nil(err)
	assert.Equal(12, len(pass))
	assert.Equal("Hgrhurhafud7", pass)

	//changing last byte of seed gives totally different password
	seed[31]++
	pass, err = MakeFriendlyPassword12a(seed)
	assert.Nil(err)
	assert.Equal("Narexwmhpba7", pass)

	//
	// Verify that all characters are possible (a-z, 0-9)

	need := "abcdefghijklmnopqrstuvwxyz0123456789"
	charCounts := make(map[byte]int)
	sha := sha256.New()
	foundAll := false
	j := 0
	
	for !foundAll {
		if j > 100 {
			t.Error("Unable to find all needed characters after", j, "iterations")
			return
		}

		//modify seed
		seed[j % 32]++
		j++


		//create pass
		pass, err = MakeFriendlyPassword12a(seed)
		assert.Nil(err)

		sha.Write([]byte(pass))
		pass = strings.ToLower(pass)

		//count characters used
		for i := range pass {
			charCounts[pass[i]]++
		}

		//found all needed characters?
		foundAll = true
		for i := range need {
			if charCounts[need[i]] == 0 {
				foundAll = false
				break
			}
		}
	}

	assert.True(foundAll)
	assert.Equal(40, j)

	//verify hash of all passwords
	assert.Equal("b28ca1ea0fdffa4af8ffb5842059d15fde68a7b8d255de89147e3ae76e9c5779", hex.EncodeToString(sha.Sum(nil)))

	//Print character frequency
	//for i := range need {
	//	fmt.Printf("%s: %d\n", string([]byte{need[i]}), charCounts[need[i]])
	//}
}

func Test_CalcPass_2017a(t *testing.T) {
	assert := assert.New(t)

	pass, err := CalcPass_2017a([]byte("password"), []byte("abcdefgh"), "google.com", 0)
	if !assert.Nil(err) {
		return
	}

	assert.Equal("Ehngowgxuty0", pass)
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
