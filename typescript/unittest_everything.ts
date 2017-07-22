import assert_test from './assert_test'
import util_test from  './util_test'
import utf8_test from  './utf8_test'
import hex_test from './hex_test'
import sha256_test from './sha256_test'
import hmacdrbg_test from './hmacdrbg_test'
import bcrypt_test from './bcrypt_test'
import parallel_bcrypt_test from './parallel_bcrypt_test'
import {execute_parallel_bcrypt_webworkers_test} from './execute_parallel_bcrypt_webworkers_test';
import {calcpass2017a_test} from './calcpass2017a_test'

async function run_tests() {
	assert_test();
	console.log('assert_test PASS');

	util_test();
	console.log('util_test PASS');

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
	
	parallel_bcrypt_test();
	console.log('parallel_bcrypt_test PASS');

	await execute_parallel_bcrypt_webworkers_test();
	console.log('execute_parallel_bcrypt_webworkers_test PASS');

	console.log('Testing calcpass2017a...');
	await calcpass2017a_test();
	console.log('calcpass2017a PASS');

	console.log('\nAll tests PASS');
}

window.addEventListener("load", function(e) {run_tests()});
