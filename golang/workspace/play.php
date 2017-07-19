<?php

//Encode bytes as base64 using the bcrypt alphabet
function bcrypt_base64_encode($data) {
	$std_alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	$bcrypt_alphabet = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	$b64 = strtr(base64_encode($data), $std_alphabet, $bcrypt_alphabet);

	//remove trailing ==
	return str_replace("=", "", $b64);
}

function _parallel_bcrypt_thread($threadIndex, $pass, $salt_bcryptBase64, $cost) {
	//derive a distinct password for each thread to work on
	$threadPassHex = hash("sha256", $pass . chr($threadIndex + 1), false);

	$options = array("cost" => $cost, "salt" => $salt_bcryptBase64);
	$hash = password_hash($threadPassHex, PASSWORD_BCRYPT, $options);

	//remove the first 29 non-unique characters
	return substr($hash, 29);	
}

function parallel_bcrypt($nThreads, $pass, $salt, $cost) {
	if (strlen($salt) != 16)
		throw new Exception("wrong salt length");

	//encode salt as bcrypt-base64
	$saltB64 = bcrypt_base64_encode($salt);

	printf("saltB64 %s\n", $saltB64);

	$hashes = "";
	for ($i = 0; $i < $nThreads; $i++) {
		$hashes .= _parallel_bcrypt_thread($i, $pass, $saltB64, $cost);
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

test2();
