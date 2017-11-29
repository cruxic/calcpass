package calcpass

//Supported Key Derivation Functions

import (
	"github.com/cruxic/calcpass/golang/calcpass/parallel_bcrypt"
	"errors"
	"fmt"
)

type KDFType byte

const (
	KDFType_QuadBcrypt12 KDFType = 12
	KDFType_QuadBcrypt13 KDFType = 13
	KDFType_QuadBcrypt14 KDFType = 14
)

func KDFTypeToString(kdftype KDFType) string {
	switch kdftype {
	case KDFType_QuadBcrypt12:
		return "QuadBcrypt12"
	case KDFType_QuadBcrypt13:
		return "QuadBcrypt13"
	case KDFType_QuadBcrypt14:
		return "QuadBcrypt14"
	default:
		return ""
	}
}

func ExecKDF(kdftype KDFType, plainPass, salt []byte) ([]byte, error) {
	switch kdftype {
	case KDFType_QuadBcrypt12:
		fallthrough
	case KDFType_QuadBcrypt13:
		fallthrough
	case KDFType_QuadBcrypt14:
		cost := int(kdftype)
		return parallel_bcrypt.Hash(4, plainPass, salt, cost)
	default:
		return nil, errors.New(fmt.Sprintf("ExecKDF: unsupported KDFType %d", int(kdftype)))
	}
}
