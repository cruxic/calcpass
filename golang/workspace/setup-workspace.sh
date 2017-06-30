#!/bin/bash

set -e  #halt on error

if [ -d ./src ]
then
    echo "src already exists"
    exit 1
fi

mkdir -p src/github.com/cruxic/calcpass/golang
ln -s ../../../../../../calcpass src/github.com/cruxic/calcpass/golang/calcpass

export GOPATH=`pwd`
echo "getting testify/assert"
go get github.com/stretchr/testify/assert
echo "getting bcrypt"
go get golang.org/x/crypto/bcrypt
echo "getting hmacdrbg"
go get github.com/cruxic/go-hmac-drbg/hmacdrbg

echo "installing bcrypt patch"
cp ../x-crypto-bcrypt-patch/*.go src/golang.org/x/crypto/bcrypt/

echo "Done."
echo "No try ./run-tests.sh"
