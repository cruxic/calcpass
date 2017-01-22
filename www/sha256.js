/**
Copyright (c) 2016 Adam Bennett (cruxic at gmail dot com).
This code is subject to the Seed Pass LICENSE:
  https://github.com/cruxic/seed-pass/blob/master/LICENSE

Adamb: the following code was adapted from Lapo Luchini's SHA256 code.
I have made some additional features such as base64 and hmac.

The original copyright notice is as follows:
*/

/* A JavaScript implementation of SHA-256 (c) 2009 Lapo Luchini <lapo@lapo.it>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * Credits:
 * largely inspired to Angel Marin's http://anmar.eu.org/projects/jssha2/
 * with ideas from Christoph Bichlmeier's http://www.bichlmeier.info/sha256.html
 * (both distributed under the BSD License)
 */

"use strict";

var sha256 = {};
if (module) module.exports = sha256;  //export as CommonJS module so firefox addon can load it

//Allocate an array of numBytes, initialized to zero
sha256.Bytes = function(numBytes) {
	if (typeof(numBytes) != 'number')
		throw new Error('Invalid numBytes');
	var nWords = Math.floor(numBytes / 4);
	if (nWords * 4 < numBytes)
		nWords++;
	this.words = new Uint32Array(nWords);
	this.nbytes = numBytes;
};

sha256.Bytes.fromStringUTF8 = function(str) {
	//TODO: encode unicode characters as UTF8!
	//Use escape() ? http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html
	//Or https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder

	if (typeof(str) != 'string')
		throw new Error('Invalid string');
	
	var bytes = new sha256.Bytes(str.length);
	var c0, c1, c2, c3, j;
	var i = 0;
	var k = 0;
	while (i + 4 <= str.length) {
		c0 = str.charCodeAt(i++);
		c1 = str.charCodeAt(i++);
		c2 = str.charCodeAt(i++);
		c3 = str.charCodeAt(i++);
		
		if (c0 > 127 || c1 > 127 || c2 > 127 || c3 > 127)
			throw new Error('Unicode not yet supported');
			
		//32bit big endian
		bytes.words[k++] = (c0 << 24) | (c1 << 16) | (c2 << 8) | c3;
	}
	
	//remainder
	if (i < str.length) {
		c0 = str.charCodeAt(i++);
		c1 = i < str.length ? str.charCodeAt(i++) : 0;
		c2 = i < str.length ? str.charCodeAt(i++) : 0;
		bytes.words[k++] = (c0 << 24) | (c1 << 16) | (c2 << 8);
	}
	
	return bytes;
};

//handy for console.log
sha256.Bytes.prototype.toString = function() {
	var str = 'Bytes(' + this.nbytes + ')';
	//include the first 64 hex characters
	var hex = this.toHex();
	if (hex.length > 64)
		hex = hex.substring(0, 64) + '...';
	return str + ' ' + hex;
};

/*sha256.Bytes.prototype.copy = function() {
	var cpy = new sha256.Bytes(this.nbytes);
	var i;
	for (i = 0; i < this.words.length; i++)
		cpy.words[i] = this.words[i];
		
	return cpy;
};*/

sha256.Bytes.prototype.toHex = function() {
	var i;
	var zeros = '00000000';
	var str = '';
	var hex = '';
	
	//for each 32bit word...
	for (i = 0; i < this.words.length; i++) {
		str += hex;
		hex = this.words[i].toString(16);
		//add leading zeros if necessary
		if (hex.length < 8)
			hex = zeros.substring(0, 8 - hex.length) + hex;
	}
	
	//the last hex word might need to be truncated
	i = this.nbytes % 4;
	if (i != 0)
		hex = hex.substring(0, i * 2);
	str += hex;
	
	return str;
};

sha256.Bytes.prototype.toByteArray = function() {
	var i;
	var res = new Array(this.nbytes);
	
	//TODO: faster?
	for (i = 0; i < res.length; i++)
		res[i] = this.getByte(i);
	
	return res;
};

sha256.Bytes.prototype.getByte = function(index) {
	var wordIndex = Math.floor(index / 4);
	if (index >= this.nbytes || wordIndex >= this.words.length)
		throw new Error('Invalid index');
	var r = index % 4;	
	return (this.words[wordIndex] >> (24 - (r * 8))) & 0xFF;
};

sha256.Bytes.prototype.erase = function() {
	this.words.fill(0);
	this.nbytes = 0;
};

//Make a deep copy of the words as a normal Array
sha256.Bytes.prototype.toWordArray = function() {
	return Array.prototype.slice.call(this.words);
};

sha256.Bytes.fromWordArray = function(words) {
	var bytes = new sha256.Bytes(words.length * 4);
	var i;
	for (i = 0; i < words.length; i++)
		bytes.words[i] = words[i];
	return bytes;
};


/*
//Not yet tested
sha256.Bytes.prototype.toOctets = function() {
	var i, word;
	var result = new Array(this.nbytes);
	
	//for all but the last 32bit word...
	var j = 0;
	for (i = 0; i < this.words.length - 1; i++) {
		word = this.words[i];		
		result[j++] = (word & 0xFF000000) >> 24;
		result[j++] = (word & 0x00FF0000) >> 16;
		result[j++] = (word & 0x0000FF00) >> 8;
		result[j++] = (word & 0x000000FF);
	}
	
	//final word might be partial
	word = this.words[i];
	if (j < this.nbytes)
		result[j++] = (word & 0xFF000000) >> 24;
	if (j < this.nbytes)
		result[j++] = (word & 0x00FF0000) >> 16;
	if (j < this.nbytes)
		result[j++] = (word & 0x0000FF00) >> 8;
	if (j < this.nbytes)
		result[j++] = (word & 0x000000FF);
	
	return result;
};*/

//adamb: adapted from https://github.com/beatgammit/base64-js/blob/master/lib/b64.js
//MIT license
sha256.Bytes.fromBase64 = function(b64) {

	function decode(elt) {
		//ASCII codes:
		// + = 43
		// / = 47
		// 0 = 48
		// a = 97
		// A = 65
		var code = elt.charCodeAt(0);
		//code === '+'
		if (code === 43) return 62;
		//code === '/'
		if (code === 47) return 63;
		//code < '0'
		if (code < 48) return -1; // no match
		//code < '0' + 10 return code - '0' + 26 + 26
		if (code < 58) return code + 4;
		//code < 'A' + 26 return code - 'A'
		if (code < 91) return code - 65;
		//code < 'a' + 26 return code - 'a' + 26
		if (code < 123) return code - 71;
	}

	var i, j, l, tmp, placeHolders, arr;

	if (b64.length % 4 > 0) {
	  throw new Error('base64 length ' + b64.length + ' is not a multiple of 4');
	}

	// the number of equal signs (place holders)
	// if there are two placeholders, than the two characters before it
	// represent one byte
	// if there is only one, then the three characters before it represent 2 bytes
	// this is just a cheap hack to not do indexOf twice
	var len = b64.length;
	placeHolders = b64.charAt(len - 2) === '=' ? 2 : b64.charAt(len - 1) === '=' ? 1 : 0;

	// base64 is 4/3 + up to two characters of the original data
	//arr = new Array(b64.length * 0.75 - placeHolders);
	arr = [];

	// if there are placeholders, only get up to the last complete 4 chars
	l = placeHolders > 0 ? b64.length - 4 : b64.length;

	for (i = 0, j = 0; i < l; i += 4, j += 3) {
	  tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3));
	  arr.push((tmp & 0xFF0000) >> 16);
	  arr.push((tmp & 0xFF00) >> 8);
	  arr.push(tmp & 0xFF);
	}

	if (placeHolders === 2) {
	  tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4);
	  arr.push(tmp & 0xFF);
	} else if (placeHolders === 1) {
	  tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2);
	  arr.push((tmp >> 8) & 0xFF);
	  arr.push(tmp & 0xFF);
	}

	//convert bytes to 32bit words
	var bytes = new sha256.Bytes(arr.length);
	//pad final word
	j = arr.length % 4;
	for (i = 0; i < j; i++)
		arr.push(0);
	i = 0;
	j = 0;
	while (i < arr.length) {
		//build 32bit big endian word
		bytes.words[j++] = 
			(arr[i++] << 24) |
			(arr[i++] << 16) |
			(arr[i++] << 8) |
			 arr[i++];
	}

	return bytes;
}


sha256.Bytes.prototype.toBase64 = function() {
	var i;
	var output = '';
	var temp, length;
	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function encode(num) {
	  return lookup.charAt(num);
	}

	function tripletToBase64 (num) {
	  return encode(num >> 18 & 0x3F) +
		encode(num >> 12 & 0x3F) +
		encode(num >> 6 & 0x3F) +
		encode(num & 0x3F);
	}

	//convert 32bit words to bytes
	var uint8 = new Array(this.words.length * 4);
	var j = 0;
	for (i = 0; i < this.words.length; i++) {
		temp = this.words[i];
		uint8[j++] = (temp >> 24) & 0xFF;
		uint8[j++] = (temp >> 16) & 0xFF;
		uint8[j++] = (temp >> 8) & 0xFF;
		uint8[j++] = temp & 0xFF;
	}
	//remove the excess (if any)
	if (uint8.length > this.nbytes) {
		uint8 = uint8.slice(0, this.nbytes);
	}

	var extraBytes = uint8.length % 3; // if we have 1 byte left, pad 2 bytes

	// go through the array every three bytes, we'll deal with trailing stuff later
	length = uint8.length - extraBytes;
	for (i = 0; i < length; i += 3) {
	  temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
	  output += tripletToBase64(temp);
	}

	// pad the end with zeros, but make sure to not forget the extra bytes
	switch (extraBytes) {
	  case 1:
		temp = uint8[uint8.length - 1];
		output += encode(temp >> 2);
		output += encode((temp << 4) & 0x3F);
		output += '==';
		break;
	  case 2:
		temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
		output += encode(temp >> 10);
		output += encode((temp >> 4) & 0x3F);
		output += encode((temp << 2) & 0x3F);
		output += '=';
		break;
	  default:
		break;
	}

	return output;
};

sha256.S = function(X, n) { return (X >>> n) | (X << (32 - n)); };
sha256.R = function(X, n) { return X >>> n; };
sha256.Ch = function(x, y, z) { return (x & y) ^ ((~x) & z); };
sha256.Maj = function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); };
sha256.Sigma0 = function(x) { return this.S(x, 2) ^ this.S(x, 13) ^ this.S(x, 22); };
sha256.Sigma1 = function(x) { return this.S(x, 6) ^ this.S(x, 11) ^ this.S(x, 25); };
sha256.Gamma0 = function(x) { return this.S(x, 7) ^ this.S(x, 18) ^ this.R(x, 3); };
sha256.Gamma1 = function(x) { return this.S(x, 17) ^ this.S(x, 19) ^ this.R(x, 10); };
sha256.K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];

// Append a 1 bit and message bit length, keeping input a multiple 64 bytes
sha256._preprocess_input = function(inputBytes) {
	var nBits = inputBytes.nbytes * 8;  //input bit length
	
	//We must append 0x80 followed by 0x00
	var paddedSize = inputBytes.nbytes + 9;  //9 is: one for 0x80 and 8 more for 64bit message length
	paddedSize += 64 - (paddedSize % 64);    //and zeros to fill the 64byte block
	var m = new Uint32Array(paddedSize / 4);
	m.set(inputBytes.words);
	//remaing words are already zero
	
	//set first bit after the message to 1
	m[nBits >> 5] |= 0x80 << (24 - nBits % 32);
	
	//64bit message bit length (big endian).
	//I think 32bit max message size is a safe assumption for JavaScript
	if (nBits > 0xFFFFFFFF)
		throw new Error('data too large');
	m[m.length-1] = nBits;

	return m;
};

/**This is the raw, core function.  It operates on Bytes and returns an array of words*/
sha256.sha256 = function(inputBytes) {
	var HASH = new Uint32Array([0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19]);
	var W = new Uint32Array(64);
	var a, b, c, d, e, f, g, h, i, j, jt;
	var T1, T2;
	
	var m = this._preprocess_input(inputBytes);	

	for (i = 0; i < m.length; i += 16) {
		a = HASH[0];
		b = HASH[1];
		c = HASH[2];
		d = HASH[3];
		e = HASH[4];
		f = HASH[5];
		g = HASH[6];
		h = HASH[7];

		for (j = 0; j < 64; j++) {
			jt = j & 0xF;
			if (j < 16)
				W[j] = m[j + i];
			else {
				W[jt] = (W[jt] + this.Gamma1(W[(j+14)&0xF]))|0;
				W[jt] = (W[jt] + W[(j+9)&0xF])|0;
				W[jt] = (W[jt] + this.Gamma0(W[(j+1)&0xF]))|0;
			}

			T1 = (h + this.Sigma1(e))|0;
			T1 = (T1 + this.Ch(e, f, g))|0;
			T1 = (T1 + this.K[j])|0;
			T1 = (T1 + W[jt])|0;
			T2 = (this.Sigma0(a) + this.Maj(a, b, c))|0;

			h = g;
			g = f;
			f = e;
			e = (d + T1)|0;
			d = c;
			c = b;
			b = a;
			a = (T1 + T2)|0;
		}

		HASH[0] = (a + HASH[0])|0;
		HASH[1] = (b + HASH[1])|0;
		HASH[2] = (c + HASH[2])|0;
		HASH[3] = (d + HASH[3])|0;
		HASH[4] = (e + HASH[4])|0;
		HASH[5] = (f + HASH[5])|0;
		HASH[6] = (g + HASH[6])|0;
		HASH[7] = (h + HASH[7])|0;
	}
	
	//erase secrets
	W.fill(0);
	m.fill(0);
	
	var bytes = new sha256.Bytes(32);
	bytes.words = HASH;
	return bytes;
};


/*Convert the given string to UTF8 bytes then calculate the SHA256 digest.
Returns a Bytes object.*/
sha256.digestString = function(s) {
	var bytes = this.Bytes.fromStringUTF8(s);
	var result = this.sha256(bytes);
	bytes.words.fill(0);
	return result;
};


/*
Calculate the HMAC-sha256 of a key and some data.
key and data must be Bytes
*/
sha256.hmac = function(key, message) {
	const BLOCKSIZE_BYTES = 64;
	const BLOCKSIZE_WORDS = 16;
	var bkey, i;

	//If key is longer SHA256 internal block size (512bits) then hash it.
	if (key.nbytes > BLOCKSIZE_BYTES)
		bkey = this.sha256(key).words;
	else
		bkey = key.words;

	//Note: at this point, bkey is <= BLOCKSIZE_BYTES.  If less,
	// the deficit will be treated as zeros.

	var bytes = new sha256.Bytes(BLOCKSIZE_BYTES + message.nbytes);
	var ipad = bytes.words;
	var opad = new Uint32Array(BLOCKSIZE_WORDS + 8);  //+8 for later concat

	for(i = 0; i < bkey.length; i++)
	{
		ipad[i] = bkey[i] ^ 0x36363636;
		opad[i] = bkey[i] ^ 0x5C5C5C5C;
	}

	//deficit is treated as zeros
	ipad.fill(0x36363636, i);
	opad.fill(0x5C5C5C5C, i);
	
	//append message to ipad and hash it
	ipad.set(message.words, BLOCKSIZE_WORDS);
	var innerHash = this.sha256(bytes);
	
	//append innerHash to opad and hash it
	opad.set(innerHash.words, BLOCKSIZE_WORDS);
	bytes.words = opad;
	bytes.nbytes = BLOCKSIZE_BYTES + 32;
	
	var result = this.sha256(bytes);
	
	//erase secrets
	if (bkey !== key.words)
		bkey.fill(0);
	ipad.fill(0);
	opad.fill(0);
	innerHash.words.fill(0);
	
	return result;
};

//A quick test to ensure the browser is executing properly
sha256.selftest = function() {
	var bytes = sha256.digestString('Hello World!\n');
	var hex = bytes.toHex();
	if (hex !== '03ba204e50d126e4674c005e04d82e84c21366780af1f43bd54a37816b6ab340')
		throw new Error('SHA-256 self-test failed!');
		
	if (bytes.getByte(0) != 0x03 || bytes.getByte(5) != 0xd1 || bytes.getByte(31) != 0x40)
		throw new Error('SHA-256 self-test failed!');
		
	var ar = bytes.toByteArray();
	if (ar[0] != 0x03 || ar[5] != 0xd1 || ar[31] != 0x40)
		throw new Error('SHA-256 self-test failed!');
		
	//regressino
	bytes = sha256.Bytes.fromStringUTF8("foo.bar1");
	if (bytes.toHex() != '666f6f2e62617231')
		throw new Error('SHA-256 self-test failed!');
		
	console.log('SHA256 pass');
}
