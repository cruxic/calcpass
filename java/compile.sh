#!/bin/bash

set -e #halt on error

mkdir -p ./classes

echo "Compiling..."
CLASSPATH=./libs/junit-4.12.jar:./libs/hamcrest-core-1.3.jar:./libs/jbcrypt-0.4.jar

javac -d ./classes -cp $CLASSPATH -sourcepath src:unit-tests \
	unit-tests/com/calcpass/util/Util_test.java \
	unit-tests/com/calcpass/parallel_bcrypt/ParallelBcrypt_test.java


echo "Testing"
java -cp $CLASSPATH:./classes org.junit.runner.JUnitCore \
	com.calcpass.util.Util_test \
	com.calcpass.parallel_bcrypt.ParallelBcrypt_test
