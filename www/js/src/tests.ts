//import sha256_test from './sha256_test'
import assert_test from './assert_test'
import utf8_test from  './utf8_test'
import hex_test from './hex_test'


function run_tests() {
	assert_test();
	console.log('assert_test PASS');

	utf8_test();
	console.log('utf8_test PASS');

	hex_test();
	console.log('hex_test PASS');

	console.log('\nAll tests PASS');
}

window.addEventListener("load", function(e) {run_tests()});
