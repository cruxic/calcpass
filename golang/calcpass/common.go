package calcpass

import (
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"fmt"
)

type AlgorithmType byte

const (
	AlgType_2018a AlgorithmType = 1
)

/**
The seed and it's associated parameters.
These values should be considered fixed for the life of the seed.
*/
type Seed struct {
	Name string

	//The 128bit random seed
	Bytes [16]byte

	//The algorithm which is used to calculate the password from the seed
	Algorithm AlgorithmType

	//The default password output format
	DefaultPasswordFormat PassFmt
}

//Expand the key to 32 bytes for compatibility with hardware backed keystores
func (seed *Seed) MakeKey32() []byte {
	//simply repeat the seed bytes twice to make 16
	sixteen := seed.Bytes[:]
	key := make([]byte, 32)
	copy(key, sixteen)
	copy(key[16:], sixteen)
	return key
}


func (seed *Seed) CalculatePassword(sitename string, revision int) (string, error) {
	message := fmt.Sprintf("%s\trev%d", sitename, revision)
	
	hash32 := util.HmacSha256(seed.MakeKey32(), []byte(message))

	return MakePassword(hash32, seed.DefaultPasswordFormat)
}

func AlgorithmTypeToString(alg AlgorithmType) string {
	switch alg {
	case AlgType_2018a:
		return "2018a"
	default:
		return ""
	}
}


