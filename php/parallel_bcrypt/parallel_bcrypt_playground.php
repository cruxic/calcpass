<?php

/*
Currently this is just a playground so I can confirm the correct implementation of my Go and Java code.
*/

//Encode bytes as base64 using the bcrypt alphabet
function bcrypt_base64_encode($data) {
	$std_alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	$bcrypt_alphabet = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	$b64 = strtr(base64_encode($data), $std_alphabet, $bcrypt_alphabet);

	//remove trailing ==
	return str_replace("=", "", $b64);
}

function _parallel_bcrypt_thread($threadIndex, $pass, $salt, $cost) {
	//derive a distinct password and salt for each thread to work on
	$threadByte = chr($threadIndex + 1);
	$threadPassHex = hash_hmac("sha256", $threadByte, $pass, false);
	$threadSalt = bcrypt_base64_encode(substr(hash_hmac("sha256", $threadByte, $salt, true), 0, 16));

	$options = array("cost" => $cost, "salt" => $threadSalt);
	$hash = password_hash($threadPassHex, PASSWORD_BCRYPT, $options);

	//remove the first 29 non-unique characters
	return substr($hash, 29);	
}

function parallel_bcrypt($nThreads, $pass, $salt, $cost) {
	if (strlen($salt) != 16)
		throw new Exception("wrong salt length");


	$hashes = "";
	for ($i = 0; $i < $nThreads; $i++) {
		$hashes .= _parallel_bcrypt_thread($i, $pass, $salt, $cost);
	}

	return hash("sha256", $hashes, true);
}

function test() {
	$salt = "calcpass2017a a@b.c";
	$salt = substr(hash("sha256", $salt, true), 0, 16);
	
	printf("parallel_bcrypt: %s\n", bin2hex(parallel_bcrypt(4, "Hello World", $salt, 13)));
}

function byteSequence($start, $count) {
	$seq = '';
	for ($i = 0; $i < $count; $i++) {
		$seq .= chr(($start + $i) & 0xFF);
	}

	return $seq;
}

function test2() {
	$seq = byteSequence(1, 32);
	$key = substr($seq, 0, 16);
	$salt = substr($seq, 16);

	printf("parallel_bcrypt: %s\n", bin2hex(parallel_bcrypt(4, $key, $salt, 13)));
}

function test3() {
	$salt = hex2bin("71d79f8218a39259a7a29aabb2dbafc3");

	printf("parallel_bcrypt: %s\n", bin2hex(parallel_bcrypt(4, "Super Secret Password", $salt, 5)));
}

test3();
