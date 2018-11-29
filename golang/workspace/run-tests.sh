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

PKG=github.com/cruxic/calcpass/golang/calcpass

#go test -v $PKG/util $PKG/card $PKG/parallel_bcrypt $PKG/type2017a
#go test -v $PKG/util
#go test -v $PKG/bytewords
#go test -v $PKG/parallel_bcrypt
go test -v $PKG/parallel_bcrypt
#go test -v $PKG

