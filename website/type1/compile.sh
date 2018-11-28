#!/bin/bash

set -e  #halt on error

pagename=$1

if [ -z "$pagename" ]
then
	echo "Example: ./compile.sh calc"
	exit 1
fi


#https://www.typescriptlang.org/docs/handbook/compiler-options.html
TSC_OPTIONS="--module amd \
	--target ES5 \
	--lib es2015,dom \
	--alwaysStrict \
	--noUnusedLocals"
	
if [ $pagename == 'worker' ]
then
	rm -f parallel-bcrypt-webworker.js
	tsc $TSC_OPTIONS --outFile _temp.js ts/parallel-bcrypt-webworker.ts
	cat ts/module-loader.js _temp.js > parallel-bcrypt-webworker.js	
else

	tsc --watch $TSC_OPTIONS --outFile ${pagename}.js ${pagename}.ts
fi



echo "Done"
