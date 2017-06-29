"use strict";

//Javascript shared between create.js and coord.js

var CARD_CHAR_W = 22;
var CARD_CHAR_H = 8;
var CARD_TOP_INDEX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUV';
var CARD_SIDE_INDEX_CHARS = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16'];

var ALPHABET_26_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var ALPHABET_26_LOWER = 'abcdefghijklmnopqrstuvwxyz';


function assert(cond) {
	if (!cond)
		throw new Error("Assertion failed");
}

function assertEq(a, b) {
	if (a != b)
		throw new Error("Assertion failed: " + a + " != " + b);
}

/**Create random numbers from bytes avoiding modulo bias.
Given byteSource object must have a nextByte() method.
*/
function UnbiasedRNG(byteSource) {
	this.byteSource = byteSource;
	this.nBytesUsed = 0;
}

UnbiasedRNG.prototype.randByte = function() {
	this.nBytesUsed++;
	return this.byteSource.nextByte();
};

//Random 16bit unsigned integer
UnbiasedRNG.prototype.rand_u16 = function() {
	return (this.randByte() << 8) | this.randByte();
}

UnbiasedRNG.prototype.rand_A_Z = function() {
	//Must avoid modulo bias!
	var b, i;
	for (i = 0; i < 1000; i++) {
		b = this.randByte() & 0x1F;
		if (b < 26)
			return String.fromCharCode(0x41 + b);  //0x41 is 'A'
	}
	
	throw new Error('Random numbers exhausted');	
};

/*UnbiasedRNG.prototype.rand_bit = function() {
	return this.randByte() & 1;
};*/

UnbiasedRNG.prototype.rand_1_8 = function() {
	return (this.randByte() & 0x07) + 1;
};

UnbiasedRNG.prototype.rand_0_9 = function() {
	//Must avoid modulo bias!
	var b, i;
	for (i = 0; i < 1000; i++) {
		b = this.randByte() & 0x0F;
		if (b < 10)
			return b;
	}
	
	throw new Error('Random numbers exhausted');
};

//Return a number integer between 0 and N-1 where N is <= 256
UnbiasedRNG.prototype.randSmallInt = function(N) {
	if (N > 256)
		throw new Error('N > 256 not implemented');
		
	//Must avoid modulo bias!
	//https://zuttobenkyou.wordpress.com/2012/10/18/generating-random-numbers-without-modulo-bias/
	var rand_limit = 256 - (256 % N);
	var i = 0;
	var byte;
	for (i = 0; i < 1000; i++) {
		byte = this.randByte();
		if (byte <= rand_limit)
			return byte % N;
	}
	
	throw new Error('Random numbers exhausted');
};

UnbiasedRNG.selftest = function() {

	var src = {
		bytes: [0x12,0x34,0x56,0x78,0x90,0xAB,0xCD,0xEF,0x01,0x02,0x03,0x00,0x1A,0x1B,0xFF,0x04],
		index: 0,
		nextByte: function() {
			return this.bytes[this.index++];
		}
	};

	var rng = new UnbiasedRNG(src);
	assertEq(rng.randByte(), 0x12);
	assertEq(rng.randByte(), 0x34);
	assertEq(rng.randByte(), 0x56);
	assertEq(rng.randByte(), 0x78);
	assertEq(rng.randByte(), 0x90);
	assertEq(rng.randByte(), 0xAB);
	
	src.index = 0;
	assertEq(rng.rand_A_Z(), 'S');
	assertEq(rng.rand_A_Z(), 'U');
	assertEq(rng.rand_A_Z(), 'W');
	assertEq(rng.rand_A_Z(), 'Y');
	src.index = 12;
	assertEq(rng.rand_A_Z(), 'E');  //skipped 1A,1B,FF to reach 04
	
	src.index = 0;
	assertEq(rng.rand_1_8(), 3);
	assertEq(rng.rand_1_8(), 5);
	assertEq(rng.rand_0_9(), 6);
	src.index = 4;
	assertEq(rng.rand_0_9(), 0);
	assertEq(rng.rand_0_9(), 1);  //skips AB,CD,EF to reach 01	
	
	console.log('UnbiasedRNG PASS');
}

/**A deterministic bit generator based on AES-128 CTR.
Seed must be 32 bytes as an array of integers or a sha256.Bytes object.
*/
function AES128_DRBG(seed) {
	if (seed.toByteArray)
		seed = seed.toByteArray();

	if (seed.length != 32 || typeof(seed[0]) != 'number')
		throw new Error('Invalid seed');
		
	//first half of seed is the IV, 2nd half is the Key.
	//This allows us to have 256bits of entropy with a 128bit block cipher
	var iv = seed.slice(0, 16);
	var key = seed.slice(16, 32);
	
	this.aes_ctr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv));
}

AES128_DRBG.prototype.nextByte = function() {
	return this.aes_ctr.encrypt([0])[0];
};

AES128_DRBG.selftest = function() {
	//The following test vectors were created with Go's crypto/aes and crypto.NewCTR
	
	var i, rbg, seed32, hex;
	
	var chunk = new Array(33);

	//
	//seed of all zeros
	seed32 = new Array(32);
	for (i = 0; i < 32; i++)
		seed32[i] = 0;
		
	rbg = new AES128_DRBG(seed32);
	for (i = 0; i < chunk.length; i++)
		chunk[i] = rbg.nextByte();
		
	hex = aesjs.util.convertBytesToString(chunk, 'hex');
	assertEq(hex, '66e94bd4ef8a2c3b884cfa59ca342b2e58e2fccefa7e3061367f1d57a4e7455a03');
	
	
	//
	//seed of all 0xFF (tests counter incrementing)
	seed32 = new Array(32);
	for (i = 0; i < 32; i++)
		seed32[i] = 0xFF;
		
	rbg = new AES128_DRBG(seed32);
	for (i = 0; i < chunk.length; i++)
		chunk[i] = rbg.nextByte();
		
	hex = aesjs.util.convertBytesToString(chunk, 'hex');
	assertEq(hex, 'bcbf217cb280cf30b2517052193ab979a1f6258c877d5fcd8964484538bfc92c5c');	
	
	//
	//arbitrary seed
	seed32 = aesjs.util.convertStringToBytes('293b800639a873a40c4b8c0ee3de1932edcbbd571966eed717ba71c7e383b2fa', 'hex');
		
	rbg = new AES128_DRBG(seed32);
	for (i = 0; i < chunk.length; i++)
		chunk[i] = rbg.nextByte();
		
	hex = aesjs.util.convertBytesToString(chunk, 'hex');
	assertEq(hex, '46f3db6d1f5ce47a25e45686dfbe433bc0880025745eda447adc913cad9abf0c18');		

	console.log('AES128_DRBG pass');
};

function setElmText(elementOrId, text) {
	var elm = elementOrId;
	if (typeof(elementOrId) == 'string')
		elm = document.getElementById(elementOrId);
		
	elm.firstChild.nodeValue = text;
}

function setVisibility(elementOrId, visible) {
	var elm = null;
	if (typeof(elementOrId) == 'string')
		elm = document.getElementById(elementOrId);
		
	elm.style.visibility = visible ? 'visible' : 'hidden';	
}

function toggleBlock(elementOrId, force) {
	var elm = null;
	if (typeof(elementOrId) == 'string')
		elm = document.getElementById(elementOrId);
		
	var mode;		
	if (force === true)
		mode = 'block';
	else if (force === false)
		mode = 'none';
	else {
		var isHidden = elm.style.display != 'block';
		mode = isHidden ? 'block' : 'none';
	}
		
	elm.style.display = mode;
}


//Round a floating point number to n decimal places
//http://www.jacklmoore.com/notes/rounding-in-javascript/
function roundn(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function shared_selftest() {
	UnbiasedRNG.selftest();
	AES128_DRBG.selftest();
}
