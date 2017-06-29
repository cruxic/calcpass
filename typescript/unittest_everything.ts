import assert_test from './assert_test'
import utf8_test from  './utf8_test'
import hex_test from './hex_test'
import sha256_test from './sha256_test'
import hmacdrbg_test from './hmacdrbg_test'
import bcrypt_test from './bcrypt_test'

function run_tests() {
	assert_test();
	console.log('assert_test PASS');

	utf8_test();
	console.log('utf8_test PASS');

	hex_test();
	console.log('hex_test PASS');

	sha256_test();
	console.log('sha256_test PASS');

	hmacdrbg_test();
	console.log('hmacdrbg_test PASS');

	bcrypt_test();
	console.log('bcrypt_test PASS');
	

	console.log('\nAll tests PASS');
}

window.addEventListener("load", function(e) {run_tests()});
