package calcpass

import (
	//"github.com/cruxic/go-hmac-drbg/hmacdrbg"
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"github.com/cruxic/calcpass/golang/calcpass/parallel_bcrypt"
	"errors"
	"fmt"
/*	"errors"
	"strings"
	"strconv"
	"sort"*/
)

/**Mix the card lock password with the website name, card-type, and desired revision number.
websiteName and cardType must be non-empty and are forced to lower case.  Revision must be >= 0.
The function will panic if any parameter is invalid.
*/
/*
func GetKeyForWebsite(hashedCardLockPassword []byte, websiteName, cardType string, revision int) []byte {
	//sanity
	if len(hashedCardLockPassword) != sha256.Size ||
		len(websiteName) == 0 ||
		len(cardType) == 0 ||
		revision < 0 {
		panic("illegal argument")
	}
	msg := strings.ToLower(cardType) + strconv.Itoa(revision) + strings.ToLower(websiteName)

	return hmacSha256(hashedCardLockPassword, []byte(msg))
}*/

func CalcPass_2017a(plainCardLockPassword, plainCharactersFromCard []byte, websiteName string, revision int) ([]byte, error) {
	if len(plainCharactersFromCard) < 6 {
		return nil, errors.New("Must have at least 6 characters from the card")
	}
	if len(plainCardLockPassword) < 8 {
		return nil, errors.New("Card lock password too short")
	}
	if len(websiteName) < 2 {
		return nil, errors.New("website name too short")
	}
	if revision < 0 {
		return nil, errors.New("revision cannot be negative")
	}

	message := fmt.Sprintf("%s %d", websiteName, revision)
	salt := util.HmacSha256(plainCharactersFromCard, []byte(message))

	const bcryptCost = 13
	hash, err := parallel_bcrypt.Hash(4, plainCardLockPassword, salt[0:parallel_bcrypt.BcryptSaltLen], bcryptCost)

	util.Erase(salt)
	salt = nil

	//fmt.Println(len(hash))
	return hash, err
}

/*
func concatAll(buffers [][]byte) []byte {
	all := make([]byte, 0, len(buffers[0]) + len(buffers))
	for i := range buffers {
		all = append(all, buffers[i]...)
	}
	return all
}
*/


