#!/bin/bash

set -e  #halt on error

if [ ! -d ./src ]
then
    echo "Missing src.  Please run ./setup-workspace.sh"
    exit 1
fi

export GOPATH=`pwd`

#go test -v github.com/cruxic/go-hmac-drbg/hmacdrbg
#go test -v golang.org/x/crypto/bcrypt

go test -v github.com/cruxic/calcpass/golang/calcpass

