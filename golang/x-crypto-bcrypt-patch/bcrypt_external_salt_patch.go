package bcrypt

import "errors"

func newFromPasswordAndSalt(password, unencodedSalt []byte, cost int) (*hashed, error) {
	if cost < MinCost {
		cost = DefaultCost
	}
	p := new(hashed)
	p.major = majorVersion
	p.minor = minorVersion

	err := checkCost(cost)
	if err != nil {
		return nil, err
	}
	p.cost = cost
	
	if len(unencodedSalt) != maxSaltSize {
		return nil, errors.New("bcrypt: salt must be exactly 16 bytes")
	}

	/*unencodedSalt := make([]byte, maxSaltSize)
	_, err = io.ReadFull(rand.Reader, unencodedSalt)
	if err != nil {
		return nil, err
	}*/

	p.salt = base64Encode(unencodedSalt)
	hash, err := bcrypt(password, p.cost, p.salt)
	if err != nil {
		return nil, err
	}
	p.hash = hash
	return p, err
}

func GenerateFromPasswordAndSalt(password, rawSalt []byte, cost int) ([]byte, error) {
	p, err := newFromPasswordAndSalt(password, rawSalt, cost)
	if err != nil {
		return nil, err
	}
	return p.Hash(), nil
}
