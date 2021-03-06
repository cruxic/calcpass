(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sha256 = require("./sha256");
var util_1 = require("./util");
//implements ByteSource
var HmacCounterByteSource = (function () {
    function HmacCounterByteSource(key, maxCounter) {
        this.key = key;
        this.maxCounter = maxCounter;
        this.counter = 0;
        this._nextBlock();
    }
    HmacCounterByteSource.prototype._nextBlock = function () {
        var four = new Uint8Array(4);
        four[0] = (this.counter >> 24) & 0xFF;
        four[1] = (this.counter >> 16) & 0xFF;
        four[2] = (this.counter >> 8) & 0xFF;
        four[3] = this.counter & 0xFF;
        //erase previous block
        if (this.block)
            util_1.erase(this.block);
        this.block = sha256.hmac(this.key, four);
        this.blockOffset = 0;
        this.counter++;
    };
    HmacCounterByteSource.prototype.NextByte = function () {
        if (this.blockOffset >= this.block.length) {
            if (this.counter >= this.maxCounter) {
                throw new Error('HmacCounterByteSource exhausted.');
            }
            this._nextBlock();
        }
        return this.block[this.blockOffset++];
    };
    return HmacCounterByteSource;
}());
exports.HmacCounterByteSource = HmacCounterByteSource;

},{"./sha256":15,"./util":20}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HmacCounterByteSource_1 = require("./HmacCounterByteSource");
var assert = require("./assert");
var hex = require("./hex");
var util_1 = require("./util");
function readInto(dest, src) {
    var count = dest.length;
    for (var i = 0; i < count; i++) {
        dest[i] = src.NextByte();
    }
}
function HmacCounterByteSource_test() {
    //Note: these test vectors were verified against the Go implementation
    var key = util_1.byteSeq(1, 32);
    var src = new HmacCounterByteSource_1.HmacCounterByteSource(key, 3);
    //read the first 32 bytes
    var block = new Uint8Array(32);
    readInto(block, src);
    assert.equal(hex.encode(block), "2c8463ac51f796043dcd8edc7d3dda424569314980cdd762a562ef88c1718ca0");
    //read 32 more
    readInto(block, src);
    assert.equal(hex.encode(block), "3df609df0d17be5e19ba72218136e82546a973b1388c2e7beb95a9184355fe18");
    //final 32
    readInto(block, src);
    assert.equal(hex.encode(block), "7b8da86c3ebdd0a2dc5dd679037d18ee079a25d585557790abeb9f4c3f21e46a");
    //one more causes error
    assert.throws(function () {
        src.NextByte();
    });
    //Verify correct 32bit counting
    src.maxCounter = 0xffffffff;
    src.counter = 0xABCDEF98;
    src.blockOffset = 32;
    readInto(block, src);
    assert.equal("5c126654874aef85c6e34130183cf70e36749eae73fa3d095c23063d6086e3af", hex.encode(block));
}
exports.HmacCounterByteSource_test = HmacCounterByteSource_test;

},{"./HmacCounterByteSource":1,"./assert":3,"./hex":11,"./util":20}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    logToConsole: true,
};
function fail(msg) {
    if (exports.config.logToConsole) {
        console.log(msg);
        console.trace();
        throw Error('Assertion failed.  See trace in console.');
    }
    else {
        throw Error('Assertion failed: ' + msg);
    }
}
exports.fail = fail;
function value2str(value, asHex) {
    var type = typeof value;
    if (type == 'string' || (type == 'object' && type !== null))
        return JSON.stringify(value);
    else if (asHex && type == 'number' && Math.floor(value) === value) {
        var hex = value.toString(16).toUpperCase();
        if (hex.length == 1)
            return '0x0' + hex;
        else
            return '0x' + hex;
    }
    else
        return "" + value;
}
/**Test array-like values for strict equality.*/
function equalArray(got, expect) {
    if (typeof (got.length) != 'number')
        fail("equalArray: value was not an array.");
    if (got.length != expect.length) {
        fail("equalArray: length was " + value2str(got.length) + ", expected " + value2str(expect.length) + '.');
    }
    for (var i = 0; i < expect.length; i++) {
        if (got[i] !== expect[i]) {
            //If one of the involved arrays is a Uint8Array then print values as hex
            var asHex = got instanceof Uint8Array || expect instanceof Uint8Array;
            var msg = 'equalArray: arrays differ at index ' + i +
                ' (' + value2str(got[i], asHex) + ' !== ' + value2str(expect[i], asHex) + ')';
            fail(msg);
        }
    }
    return got;
}
exports.equalArray = equalArray;
function equal(value, expect) {
    if (value !== expect) {
        var msg = "assert.equal FAILED: " + value2str(value) + " !== " + value2str(expect);
        fail(msg);
    }
    return value;
}
exports.equal = equal;
/**Throw if value is not "true-ish"*/
function isTrue(condition) {
    if (!condition) {
        fail("assert.isTrue FAILED: expected true-ish but got " + value2str(condition));
    }
    return condition;
}
exports.isTrue = isTrue;
/**Throw if value is not "false-ish"*/
function isFalse(condition) {
    if (condition) {
        fail("assert.isFalse FAILED: expected false-ish but got " + value2str(condition));
    }
    return condition;
}
exports.isFalse = isFalse;
function throws(func) {
    try {
        func();
        fail("assert.throws FAILED: function did not throw anything as expected.");
    }
    catch (e) {
        //pass
    }
}
exports.throws = throws;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("./assert");
function throwsAssertionFailure(func) {
    assert.config.logToConsole = false;
    try {
        func();
        assert.config.logToConsole = true;
        throw Error('Function did not throw');
    }
    catch (e) {
        //pass
        assert.config.logToConsole = true;
    }
}
function assert_test() {
    //
    // assert.equal
    assert.equal(5 - 3, 7 - 5);
    var undef1, undef2;
    assert.equal(undef1, undef2);
    assert.equal(null, null);
    throwsAssertionFailure(function () { return assert.equal(1, 2); });
    //
    // assert.isTrue
    assert.isTrue(true);
    assert.isTrue(3);
    assert.isTrue("hello");
    throwsAssertionFailure(function () { return assert.isTrue(false); });
    //
    // assert.isFalse
    assert.isFalse(false);
    assert.isFalse(0);
    assert.isFalse("");
    throwsAssertionFailure(function () { return assert.isFalse(true); });
    //
    // assert.fail()
    throwsAssertionFailure(function () { return assert.fail('darn'); });
    //
    // assert.equalArray
    assert.equalArray([2 - 1, 1 + 1, 2 + 1], [1, 2, 3]);
    assert.equalArray([], []);
    assert.equalArray('a,b,c'.split(','), ['a', 'b', 'c']);
    //normal array can be compared to TypedArray
    var a = [1, 2, 3, 127, 128, 255];
    assert.equalArray(new Uint8Array(a), a);
    throwsAssertionFailure(function () { return assert.equalArray(new Uint8Array(a), [1, 2, 3, 4, 5, 6]); });
    //wrong length
    throwsAssertionFailure(function () { return assert.equalArray([1, 2, 3], [1, 2, 3, 4]); });
    //strict equality
    throwsAssertionFailure(function () { return assert.equalArray([1, 0], [1, null]); });
}
exports.default = assert_test;

},{"./assert":3}],5:[function(require,module,exports){
/*The following is a bcrypt implementation which implements the bare minimum necessary
for calcpass.  It is mostly a simplification of bcrypt.js (https://github.com/dcodeIO/bcrypt.js).
Because much of the interals are copy/paste (with minor tweaks) it is a derived work and
thus retains the original copyright notice:
*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 Copyright (c) 2012 Nevins Bartolomeo <nevins.bartolomeo@gmail.com>
 Copyright (c) 2012 Shane Girish <shaneGirish@gmail.com>
 Copyright (c) 2014 Daniel Wirtz <dcode@dcode.io>

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:
 1. Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 3. The name of the author may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/bcrypt.js for details
 */
exports.saltSize = 16;
exports.rawHashSize = 23;
function nop_progress_callback(percent) {
}
/**Hash the given password using the bcrypt algorithm.  Use this function
if you desire the bcrypt output without base64 encoding.
It returns 23 bytes (not base 64 encoded).
Salt must be exactly 16 bytes.
*/
function rawBcrypt(pass, salt, cost, progressCallback) {
    if (!pass || pass.length == 0)
        throw new Error('Invalid pass');
    if (!salt || salt.length != exports.saltSize)
        throw new Error('Salt must be exactly 16 bytes');
    if (!cost || cost < 4 || cost > 31)
        throw new Error('Invalid cost');
    if (!progressCallback)
        progressCallback = nop_progress_callback;
    var rounds = (1 << cost) >>> 0;
    //the original bcrypt implementation always included the null terminator
    var passWithNull = new Uint8Array(pass.length + 1);
    passWithNull.set(pass);
    passWithNull[pass.length] = 0;
    pass = null;
    var P = new Int32Array(P_ORIG);
    var S = new Int32Array(S_ORIG);
    _ekskey(salt, passWithNull, P, S);
    var pWords = key2words(passWithNull, P);
    var saltWords = key2words(salt, P);
    //The slow loop!
    var i;
    for (i = 0; i < rounds; i++) {
        _key(pWords, P, S);
        _key(saltWords, P, S);
        //report progress every 1024 rounds.
        if (((i + 1) & 0x3ff) === 0) {
            //reserve the last 2% for finalization
            progressCallback(i / (rounds * 1.02));
        }
    }
    var cdata = C_ORIG.slice();
    var clen = cdata.length;
    var j;
    for (i = 0; i < 64; i++) {
        for (j = 0; j < (clen >> 1); j++)
            _encipherOffset(cdata, j << 1, P, S);
    }
    //convert cdata words to 24 bytes
    var ret = [];
    for (i = 0; i < clen; i++) {
        ret.push(((cdata[i] >> 24) & 0xff) >>> 0);
        ret.push(((cdata[i] >> 16) & 0xff) >>> 0);
        ret.push(((cdata[i] >> 8) & 0xff) >>> 0);
        ret.push((cdata[i] & 0xff) >>> 0);
    }
    progressCallback(1.0);
    //keep only the first 23
    return new Uint8Array(ret.slice(0, exports.rawHashSize));
}
exports.rawBcrypt = rawBcrypt;
/**Encode raw data using bcrypts flavor of Base64.*/
function encodeBcrypt64(data) {
    //bcrypt's own non-standard base64 dictionary.
    var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split('');
    if (!data || data.length == 0)
        throw new Error("Empty data");
    var off = 0;
    var len = data.length;
    var c1, c2;
    var s = "";
    while (off < len) {
        c1 = data[off++] & 0xff;
        s += BASE64_CODE[(c1 >> 2) & 0x3f];
        c1 = (c1 & 0x03) << 4;
        if (off >= len) {
            s += BASE64_CODE[c1 & 0x3f];
            break;
        }
        c2 = data[off++] & 0xff;
        c1 |= (c2 >> 4) & 0x0f;
        s += BASE64_CODE[c1 & 0x3f];
        c1 = (c2 & 0x0f) << 2;
        if (off >= len) {
            s += BASE64_CODE[c1 & 0x3f];
            break;
        }
        c2 = data[off++] & 0xff;
        c1 |= (c2 >> 6) & 0x03;
        s += BASE64_CODE[c1 & 0x3f];
        s += BASE64_CODE[c2 & 0x3f];
    }
    return s;
}
exports.encodeBcrypt64 = encodeBcrypt64;
/**Hash the given password with given random salt and return a canonical bcrypt string.
algorithmId should be something like "2a", "2b" or "2y" but it has no influence on the actual hashing.
*/
function bcrypt(pass, salt, cost, progressCallback, algorithmId) {
    if (!algorithmId)
        algorithmId = "2a";
    if (algorithmId.length != 2)
        throw new Error("Invalid algorithmId");
    var raw = rawBcrypt(pass, salt, cost, progressCallback);
    var costStr = "" + cost;
    if (costStr.length < 2)
        costStr = "0" + costStr;
    return "$" + algorithmId + "$" + costStr + "$" + encodeBcrypt64(salt) + encodeBcrypt64(raw);
}
exports.bcrypt = bcrypt;
function key2words(key, P) {
    var plen = P.length;
    var offp = [0];
    var res = new Int32Array(plen);
    for (var i = 0; i < plen; i++) {
        res[i] = nextWord(key, offp);
    }
    return res;
}
function _key(keyWords, P, S) {
    var i;
    var lr = [0, 0];
    var n = P.length;
    for (i = 0; i < n; i++) {
        P[i] ^= keyWords[i];
    }
    i = 0;
    while (i < n) {
        _encipher(lr, P, S);
        P[i++] = lr[0];
        P[i++] = lr[1];
    }
    i = 0;
    n = S.length;
    while (i < n) {
        _encipher(lr, P, S);
        S[i++] = lr[0];
        S[i++] = lr[1];
    }
}
/**Read a 32bit big-endian word and advance the offset by 4 (modulo data length)*/
function nextWord(data, offsetRef) {
    var dlen = data.length;
    var offp = offsetRef[0];
    var word = data[offp] << 24 |
        data[(offp + 1) % dlen] << 16 |
        data[(offp + 2) % dlen] << 8 |
        data[(offp + 3) % dlen];
    offsetRef[0] = (offp + 4) % dlen;
    return word;
}
/**
 * Expensive key schedule Blowfish.
 */
function _ekskey(data, key, P, S) {
    var lr = [0, 0];
    var plen = P.length;
    var slen = S.length;
    var offp = [0];
    for (var i = 0; i < plen; i++)
        P[i] ^= nextWord(key, offp);
    offp[0] = 0;
    for (i = 0; i < plen; i += 2) {
        lr[0] ^= nextWord(data, offp);
        lr[1] ^= nextWord(data, offp);
        _encipher(lr, P, S);
        P[i] = lr[0];
        P[i + 1] = lr[1];
    }
    for (i = 0; i < slen; i += 2) {
        lr[0] ^= nextWord(data, offp);
        lr[1] ^= nextWord(data, offp);
        _encipher(lr, P, S);
        S[i] = lr[0];
        S[i + 1] = lr[1];
    }
}
function _encipherOffset(lr, offset, P, S) {
    var tmp = [lr[offset], lr[offset + 1]];
    _encipher(tmp, P, S);
    lr[offset] = tmp[0];
    lr[offset + 1] = tmp[1];
}
function _encipher(lr, P, S) {
    var BLOWFISH_NUM_ROUNDS = 16;
    var n;
    var l = lr[0];
    var r = lr[1];
    l ^= P[0];
    //Iteration 0
    n = S[l >>> 24];
    n += S[0x100 | ((l >> 16) & 0xff)];
    n ^= S[0x200 | ((l >> 8) & 0xff)];
    n += S[0x300 | (l & 0xff)];
    r ^= n ^ P[1];
    n = S[r >>> 24];
    n += S[0x100 | ((r >> 16) & 0xff)];
    n ^= S[0x200 | ((r >> 8) & 0xff)];
    n += S[0x300 | (r & 0xff)];
    l ^= n ^ P[2];
    //Iteration 1
    n = S[l >>> 24];
    n += S[0x100 | ((l >> 16) & 0xff)];
    n ^= S[0x200 | ((l >> 8) & 0xff)];
    n += S[0x300 | (l & 0xff)];
    r ^= n ^ P[3];
    n = S[r >>> 24];
    n += S[0x100 | ((r >> 16) & 0xff)];
    n ^= S[0x200 | ((r >> 8) & 0xff)];
    n += S[0x300 | (r & 0xff)];
    l ^= n ^ P[4];
    //Iteration 2
    n = S[l >>> 24];
    n += S[0x100 | ((l >> 16) & 0xff)];
    n ^= S[0x200 | ((l >> 8) & 0xff)];
    n += S[0x300 | (l & 0xff)];
    r ^= n ^ P[5];
    n = S[r >>> 24];
    n += S[0x100 | ((r >> 16) & 0xff)];
    n ^= S[0x200 | ((r >> 8) & 0xff)];
    n += S[0x300 | (r & 0xff)];
    l ^= n ^ P[6];
    //Iteration 3
    n = S[l >>> 24];
    n += S[0x100 | ((l >> 16) & 0xff)];
    n ^= S[0x200 | ((l >> 8) & 0xff)];
    n += S[0x300 | (l & 0xff)];
    r ^= n ^ P[7];
    n = S[r >>> 24];
    n += S[0x100 | ((r >> 16) & 0xff)];
    n ^= S[0x200 | ((r >> 8) & 0xff)];
    n += S[0x300 | (r & 0xff)];
    l ^= n ^ P[8];
    //Iteration 4
    n = S[l >>> 24];
    n += S[0x100 | ((l >> 16) & 0xff)];
    n ^= S[0x200 | ((l >> 8) & 0xff)];
    n += S[0x300 | (l & 0xff)];
    r ^= n ^ P[9];
    n = S[r >>> 24];
    n += S[0x100 | ((r >> 16) & 0xff)];
    n ^= S[0x200 | ((r >> 8) & 0xff)];
    n += S[0x300 | (r & 0xff)];
    l ^= n ^ P[10];
    //Iteration 5
    n = S[l >>> 24];
    n += S[0x100 | ((l >> 16) & 0xff)];
    n ^= S[0x200 | ((l >> 8) & 0xff)];
    n += S[0x300 | (l & 0xff)];
    r ^= n ^ P[11];
    n = S[r >>> 24];
    n += S[0x100 | ((r >> 16) & 0xff)];
    n ^= S[0x200 | ((r >> 8) & 0xff)];
    n += S[0x300 | (r & 0xff)];
    l ^= n ^ P[12];
    //Iteration 6
    n = S[l >>> 24];
    n += S[0x100 | ((l >> 16) & 0xff)];
    n ^= S[0x200 | ((l >> 8) & 0xff)];
    n += S[0x300 | (l & 0xff)];
    r ^= n ^ P[13];
    n = S[r >>> 24];
    n += S[0x100 | ((r >> 16) & 0xff)];
    n ^= S[0x200 | ((r >> 8) & 0xff)];
    n += S[0x300 | (r & 0xff)];
    l ^= n ^ P[14];
    //Iteration 7
    n = S[l >>> 24];
    n += S[0x100 | ((l >> 16) & 0xff)];
    n ^= S[0x200 | ((l >> 8) & 0xff)];
    n += S[0x300 | (l & 0xff)];
    r ^= n ^ P[15];
    n = S[r >>> 24];
    n += S[0x100 | ((r >> 16) & 0xff)];
    n ^= S[0x200 | ((r >> 8) & 0xff)];
    n += S[0x300 | (r & 0xff)];
    l ^= n ^ P[16];
    /*
     var i = 0,
         k=BLOWFISH_NUM_ROUNDS-2;
     while (i<=k) {
         // Feistel substitution on left word
         n  = S[l >>> 24];
         n += S[0x100 | ((l >> 16) & 0xff)];
         n ^= S[0x200 | ((l >> 8) & 0xff)];
         n += S[0x300 | (l & 0xff)];
         r ^= n ^ P[++i];
         // Feistel substitution on right word
         n  = S[r >>> 24];
         n += S[0x100 | ((r >> 16) & 0xff)];
         n ^= S[0x200 | ((r >> 8) & 0xff)];
         n += S[0x300 | (r & 0xff)];
         l ^= n ^ P[++i];
     }*/
    lr[0] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
    lr[1] = l;
}
var P_ORIG = [
    0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344, 0xa4093822,
    0x299f31d0, 0x082efa98, 0xec4e6c89, 0x452821e6, 0x38d01377,
    0xbe5466cf, 0x34e90c6c, 0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5,
    0xb5470917, 0x9216d5d9, 0x8979fb1b
];
var S_ORIG = [
    0xd1310ba6, 0x98dfb5ac, 0x2ffd72db, 0xd01adfb7, 0xb8e1afed,
    0x6a267e96, 0xba7c9045, 0xf12c7f99, 0x24a19947, 0xb3916cf7,
    0x0801f2e2, 0x858efc16, 0x636920d8, 0x71574e69, 0xa458fea3,
    0xf4933d7e, 0x0d95748f, 0x728eb658, 0x718bcd58, 0x82154aee,
    0x7b54a41d, 0xc25a59b5, 0x9c30d539, 0x2af26013, 0xc5d1b023,
    0x286085f0, 0xca417918, 0xb8db38ef, 0x8e79dcb0, 0x603a180e,
    0x6c9e0e8b, 0xb01e8a3e, 0xd71577c1, 0xbd314b27, 0x78af2fda,
    0x55605c60, 0xe65525f3, 0xaa55ab94, 0x57489862, 0x63e81440,
    0x55ca396a, 0x2aab10b6, 0xb4cc5c34, 0x1141e8ce, 0xa15486af,
    0x7c72e993, 0xb3ee1411, 0x636fbc2a, 0x2ba9c55d, 0x741831f6,
    0xce5c3e16, 0x9b87931e, 0xafd6ba33, 0x6c24cf5c, 0x7a325381,
    0x28958677, 0x3b8f4898, 0x6b4bb9af, 0xc4bfe81b, 0x66282193,
    0x61d809cc, 0xfb21a991, 0x487cac60, 0x5dec8032, 0xef845d5d,
    0xe98575b1, 0xdc262302, 0xeb651b88, 0x23893e81, 0xd396acc5,
    0x0f6d6ff3, 0x83f44239, 0x2e0b4482, 0xa4842004, 0x69c8f04a,
    0x9e1f9b5e, 0x21c66842, 0xf6e96c9a, 0x670c9c61, 0xabd388f0,
    0x6a51a0d2, 0xd8542f68, 0x960fa728, 0xab5133a3, 0x6eef0b6c,
    0x137a3be4, 0xba3bf050, 0x7efb2a98, 0xa1f1651d, 0x39af0176,
    0x66ca593e, 0x82430e88, 0x8cee8619, 0x456f9fb4, 0x7d84a5c3,
    0x3b8b5ebe, 0xe06f75d8, 0x85c12073, 0x401a449f, 0x56c16aa6,
    0x4ed3aa62, 0x363f7706, 0x1bfedf72, 0x429b023d, 0x37d0d724,
    0xd00a1248, 0xdb0fead3, 0x49f1c09b, 0x075372c9, 0x80991b7b,
    0x25d479d8, 0xf6e8def7, 0xe3fe501a, 0xb6794c3b, 0x976ce0bd,
    0x04c006ba, 0xc1a94fb6, 0x409f60c4, 0x5e5c9ec2, 0x196a2463,
    0x68fb6faf, 0x3e6c53b5, 0x1339b2eb, 0x3b52ec6f, 0x6dfc511f,
    0x9b30952c, 0xcc814544, 0xaf5ebd09, 0xbee3d004, 0xde334afd,
    0x660f2807, 0x192e4bb3, 0xc0cba857, 0x45c8740f, 0xd20b5f39,
    0xb9d3fbdb, 0x5579c0bd, 0x1a60320a, 0xd6a100c6, 0x402c7279,
    0x679f25fe, 0xfb1fa3cc, 0x8ea5e9f8, 0xdb3222f8, 0x3c7516df,
    0xfd616b15, 0x2f501ec8, 0xad0552ab, 0x323db5fa, 0xfd238760,
    0x53317b48, 0x3e00df82, 0x9e5c57bb, 0xca6f8ca0, 0x1a87562e,
    0xdf1769db, 0xd542a8f6, 0x287effc3, 0xac6732c6, 0x8c4f5573,
    0x695b27b0, 0xbbca58c8, 0xe1ffa35d, 0xb8f011a0, 0x10fa3d98,
    0xfd2183b8, 0x4afcb56c, 0x2dd1d35b, 0x9a53e479, 0xb6f84565,
    0xd28e49bc, 0x4bfb9790, 0xe1ddf2da, 0xa4cb7e33, 0x62fb1341,
    0xcee4c6e8, 0xef20cada, 0x36774c01, 0xd07e9efe, 0x2bf11fb4,
    0x95dbda4d, 0xae909198, 0xeaad8e71, 0x6b93d5a0, 0xd08ed1d0,
    0xafc725e0, 0x8e3c5b2f, 0x8e7594b7, 0x8ff6e2fb, 0xf2122b64,
    0x8888b812, 0x900df01c, 0x4fad5ea0, 0x688fc31c, 0xd1cff191,
    0xb3a8c1ad, 0x2f2f2218, 0xbe0e1777, 0xea752dfe, 0x8b021fa1,
    0xe5a0cc0f, 0xb56f74e8, 0x18acf3d6, 0xce89e299, 0xb4a84fe0,
    0xfd13e0b7, 0x7cc43b81, 0xd2ada8d9, 0x165fa266, 0x80957705,
    0x93cc7314, 0x211a1477, 0xe6ad2065, 0x77b5fa86, 0xc75442f5,
    0xfb9d35cf, 0xebcdaf0c, 0x7b3e89a0, 0xd6411bd3, 0xae1e7e49,
    0x00250e2d, 0x2071b35e, 0x226800bb, 0x57b8e0af, 0x2464369b,
    0xf009b91e, 0x5563911d, 0x59dfa6aa, 0x78c14389, 0xd95a537f,
    0x207d5ba2, 0x02e5b9c5, 0x83260376, 0x6295cfa9, 0x11c81968,
    0x4e734a41, 0xb3472dca, 0x7b14a94a, 0x1b510052, 0x9a532915,
    0xd60f573f, 0xbc9bc6e4, 0x2b60a476, 0x81e67400, 0x08ba6fb5,
    0x571be91f, 0xf296ec6b, 0x2a0dd915, 0xb6636521, 0xe7b9f9b6,
    0xff34052e, 0xc5855664, 0x53b02d5d, 0xa99f8fa1, 0x08ba4799,
    0x6e85076a, 0x4b7a70e9, 0xb5b32944, 0xdb75092e, 0xc4192623,
    0xad6ea6b0, 0x49a7df7d, 0x9cee60b8, 0x8fedb266, 0xecaa8c71,
    0x699a17ff, 0x5664526c, 0xc2b19ee1, 0x193602a5, 0x75094c29,
    0xa0591340, 0xe4183a3e, 0x3f54989a, 0x5b429d65, 0x6b8fe4d6,
    0x99f73fd6, 0xa1d29c07, 0xefe830f5, 0x4d2d38e6, 0xf0255dc1,
    0x4cdd2086, 0x8470eb26, 0x6382e9c6, 0x021ecc5e, 0x09686b3f,
    0x3ebaefc9, 0x3c971814, 0x6b6a70a1, 0x687f3584, 0x52a0e286,
    0xb79c5305, 0xaa500737, 0x3e07841c, 0x7fdeae5c, 0x8e7d44ec,
    0x5716f2b8, 0xb03ada37, 0xf0500c0d, 0xf01c1f04, 0x0200b3ff,
    0xae0cf51a, 0x3cb574b2, 0x25837a58, 0xdc0921bd, 0xd19113f9,
    0x7ca92ff6, 0x94324773, 0x22f54701, 0x3ae5e581, 0x37c2dadc,
    0xc8b57634, 0x9af3dda7, 0xa9446146, 0x0fd0030e, 0xecc8c73e,
    0xa4751e41, 0xe238cd99, 0x3bea0e2f, 0x3280bba1, 0x183eb331,
    0x4e548b38, 0x4f6db908, 0x6f420d03, 0xf60a04bf, 0x2cb81290,
    0x24977c79, 0x5679b072, 0xbcaf89af, 0xde9a771f, 0xd9930810,
    0xb38bae12, 0xdccf3f2e, 0x5512721f, 0x2e6b7124, 0x501adde6,
    0x9f84cd87, 0x7a584718, 0x7408da17, 0xbc9f9abc, 0xe94b7d8c,
    0xec7aec3a, 0xdb851dfa, 0x63094366, 0xc464c3d2, 0xef1c1847,
    0x3215d908, 0xdd433b37, 0x24c2ba16, 0x12a14d43, 0x2a65c451,
    0x50940002, 0x133ae4dd, 0x71dff89e, 0x10314e55, 0x81ac77d6,
    0x5f11199b, 0x043556f1, 0xd7a3c76b, 0x3c11183b, 0x5924a509,
    0xf28fe6ed, 0x97f1fbfa, 0x9ebabf2c, 0x1e153c6e, 0x86e34570,
    0xeae96fb1, 0x860e5e0a, 0x5a3e2ab3, 0x771fe71c, 0x4e3d06fa,
    0x2965dcb9, 0x99e71d0f, 0x803e89d6, 0x5266c825, 0x2e4cc978,
    0x9c10b36a, 0xc6150eba, 0x94e2ea78, 0xa5fc3c53, 0x1e0a2df4,
    0xf2f74ea7, 0x361d2b3d, 0x1939260f, 0x19c27960, 0x5223a708,
    0xf71312b6, 0xebadfe6e, 0xeac31f66, 0xe3bc4595, 0xa67bc883,
    0xb17f37d1, 0x018cff28, 0xc332ddef, 0xbe6c5aa5, 0x65582185,
    0x68ab9802, 0xeecea50f, 0xdb2f953b, 0x2aef7dad, 0x5b6e2f84,
    0x1521b628, 0x29076170, 0xecdd4775, 0x619f1510, 0x13cca830,
    0xeb61bd96, 0x0334fe1e, 0xaa0363cf, 0xb5735c90, 0x4c70a239,
    0xd59e9e0b, 0xcbaade14, 0xeecc86bc, 0x60622ca7, 0x9cab5cab,
    0xb2f3846e, 0x648b1eaf, 0x19bdf0ca, 0xa02369b9, 0x655abb50,
    0x40685a32, 0x3c2ab4b3, 0x319ee9d5, 0xc021b8f7, 0x9b540b19,
    0x875fa099, 0x95f7997e, 0x623d7da8, 0xf837889a, 0x97e32d77,
    0x11ed935f, 0x16681281, 0x0e358829, 0xc7e61fd6, 0x96dedfa1,
    0x7858ba99, 0x57f584a5, 0x1b227263, 0x9b83c3ff, 0x1ac24696,
    0xcdb30aeb, 0x532e3054, 0x8fd948e4, 0x6dbc3128, 0x58ebf2ef,
    0x34c6ffea, 0xfe28ed61, 0xee7c3c73, 0x5d4a14d9, 0xe864b7e3,
    0x42105d14, 0x203e13e0, 0x45eee2b6, 0xa3aaabea, 0xdb6c4f15,
    0xfacb4fd0, 0xc742f442, 0xef6abbb5, 0x654f3b1d, 0x41cd2105,
    0xd81e799e, 0x86854dc7, 0xe44b476a, 0x3d816250, 0xcf62a1f2,
    0x5b8d2646, 0xfc8883a0, 0xc1c7b6a3, 0x7f1524c3, 0x69cb7492,
    0x47848a0b, 0x5692b285, 0x095bbf00, 0xad19489d, 0x1462b174,
    0x23820e00, 0x58428d2a, 0x0c55f5ea, 0x1dadf43e, 0x233f7061,
    0x3372f092, 0x8d937e41, 0xd65fecf1, 0x6c223bdb, 0x7cde3759,
    0xcbee7460, 0x4085f2a7, 0xce77326e, 0xa6078084, 0x19f8509e,
    0xe8efd855, 0x61d99735, 0xa969a7aa, 0xc50c06c2, 0x5a04abfc,
    0x800bcadc, 0x9e447a2e, 0xc3453484, 0xfdd56705, 0x0e1e9ec9,
    0xdb73dbd3, 0x105588cd, 0x675fda79, 0xe3674340, 0xc5c43465,
    0x713e38d8, 0x3d28f89e, 0xf16dff20, 0x153e21e7, 0x8fb03d4a,
    0xe6e39f2b, 0xdb83adf7, 0xe93d5a68, 0x948140f7, 0xf64c261c,
    0x94692934, 0x411520f7, 0x7602d4f7, 0xbcf46b2e, 0xd4a20068,
    0xd4082471, 0x3320f46a, 0x43b7d4b7, 0x500061af, 0x1e39f62e,
    0x97244546, 0x14214f74, 0xbf8b8840, 0x4d95fc1d, 0x96b591af,
    0x70f4ddd3, 0x66a02f45, 0xbfbc09ec, 0x03bd9785, 0x7fac6dd0,
    0x31cb8504, 0x96eb27b3, 0x55fd3941, 0xda2547e6, 0xabca0a9a,
    0x28507825, 0x530429f4, 0x0a2c86da, 0xe9b66dfb, 0x68dc1462,
    0xd7486900, 0x680ec0a4, 0x27a18dee, 0x4f3ffea2, 0xe887ad8c,
    0xb58ce006, 0x7af4d6b6, 0xaace1e7c, 0xd3375fec, 0xce78a399,
    0x406b2a42, 0x20fe9e35, 0xd9f385b9, 0xee39d7ab, 0x3b124e8b,
    0x1dc9faf7, 0x4b6d1856, 0x26a36631, 0xeae397b2, 0x3a6efa74,
    0xdd5b4332, 0x6841e7f7, 0xca7820fb, 0xfb0af54e, 0xd8feb397,
    0x454056ac, 0xba489527, 0x55533a3a, 0x20838d87, 0xfe6ba9b7,
    0xd096954b, 0x55a867bc, 0xa1159a58, 0xcca92963, 0x99e1db33,
    0xa62a4a56, 0x3f3125f9, 0x5ef47e1c, 0x9029317c, 0xfdf8e802,
    0x04272f70, 0x80bb155c, 0x05282ce3, 0x95c11548, 0xe4c66d22,
    0x48c1133f, 0xc70f86dc, 0x07f9c9ee, 0x41041f0f, 0x404779a4,
    0x5d886e17, 0x325f51eb, 0xd59bc0d1, 0xf2bcc18f, 0x41113564,
    0x257b7834, 0x602a9c60, 0xdff8e8a3, 0x1f636c1b, 0x0e12b4c2,
    0x02e1329e, 0xaf664fd1, 0xcad18115, 0x6b2395e0, 0x333e92e1,
    0x3b240b62, 0xeebeb922, 0x85b2a20e, 0xe6ba0d99, 0xde720c8c,
    0x2da2f728, 0xd0127845, 0x95b794fd, 0x647d0862, 0xe7ccf5f0,
    0x5449a36f, 0x877d48fa, 0xc39dfd27, 0xf33e8d1e, 0x0a476341,
    0x992eff74, 0x3a6f6eab, 0xf4f8fd37, 0xa812dc60, 0xa1ebddf8,
    0x991be14c, 0xdb6e6b0d, 0xc67b5510, 0x6d672c37, 0x2765d43b,
    0xdcd0e804, 0xf1290dc7, 0xcc00ffa3, 0xb5390f92, 0x690fed0b,
    0x667b9ffb, 0xcedb7d9c, 0xa091cf0b, 0xd9155ea3, 0xbb132f88,
    0x515bad24, 0x7b9479bf, 0x763bd6eb, 0x37392eb3, 0xcc115979,
    0x8026e297, 0xf42e312d, 0x6842ada7, 0xc66a2b3b, 0x12754ccc,
    0x782ef11c, 0x6a124237, 0xb79251e7, 0x06a1bbe6, 0x4bfb6350,
    0x1a6b1018, 0x11caedfa, 0x3d25bdd8, 0xe2e1c3c9, 0x44421659,
    0x0a121386, 0xd90cec6e, 0xd5abea2a, 0x64af674e, 0xda86a85f,
    0xbebfe988, 0x64e4c3fe, 0x9dbc8057, 0xf0f7c086, 0x60787bf8,
    0x6003604d, 0xd1fd8346, 0xf6381fb0, 0x7745ae04, 0xd736fccc,
    0x83426b33, 0xf01eab71, 0xb0804187, 0x3c005e5f, 0x77a057be,
    0xbde8ae24, 0x55464299, 0xbf582e61, 0x4e58f48f, 0xf2ddfda2,
    0xf474ef38, 0x8789bdc2, 0x5366f9c3, 0xc8b38e74, 0xb475f255,
    0x46fcd9b9, 0x7aeb2661, 0x8b1ddf84, 0x846a0e79, 0x915f95e2,
    0x466e598e, 0x20b45770, 0x8cd55591, 0xc902de4c, 0xb90bace1,
    0xbb8205d0, 0x11a86248, 0x7574a99e, 0xb77f19b6, 0xe0a9dc09,
    0x662d09a1, 0xc4324633, 0xe85a1f02, 0x09f0be8c, 0x4a99a025,
    0x1d6efe10, 0x1ab93d1d, 0x0ba5a4df, 0xa186f20f, 0x2868f169,
    0xdcb7da83, 0x573906fe, 0xa1e2ce9b, 0x4fcd7f52, 0x50115e01,
    0xa70683fa, 0xa002b5c4, 0x0de6d027, 0x9af88c27, 0x773f8641,
    0xc3604c06, 0x61a806b5, 0xf0177a28, 0xc0f586e0, 0x006058aa,
    0x30dc7d62, 0x11e69ed7, 0x2338ea63, 0x53c2dd94, 0xc2c21634,
    0xbbcbee56, 0x90bcb6de, 0xebfc7da1, 0xce591d76, 0x6f05e409,
    0x4b7c0188, 0x39720a3d, 0x7c927c24, 0x86e3725f, 0x724d9db9,
    0x1ac15bb4, 0xd39eb8fc, 0xed545578, 0x08fca5b5, 0xd83d7cd3,
    0x4dad0fc4, 0x1e50ef5e, 0xb161e6f8, 0xa28514d9, 0x6c51133c,
    0x6fd5c7e7, 0x56e14ec4, 0x362abfce, 0xddc6c837, 0xd79a3234,
    0x92638212, 0x670efa8e, 0x406000e0, 0x3a39ce37, 0xd3faf5cf,
    0xabc27737, 0x5ac52d1b, 0x5cb0679e, 0x4fa33742, 0xd3822740,
    0x99bc9bbe, 0xd5118e9d, 0xbf0f7315, 0xd62d1c7e, 0xc700c47b,
    0xb78c1b6b, 0x21a19045, 0xb26eb1be, 0x6a366eb4, 0x5748ab2f,
    0xbc946e79, 0xc6a376d2, 0x6549c2c8, 0x530ff8ee, 0x468dde7d,
    0xd5730a1d, 0x4cd04dc6, 0x2939bbdb, 0xa9ba4650, 0xac9526e8,
    0xbe5ee304, 0xa1fad5f0, 0x6a2d519a, 0x63ef8ce2, 0x9a86ee22,
    0xc089c2b8, 0x43242ef6, 0xa51e03aa, 0x9cf2d0a4, 0x83c061ba,
    0x9be96a4d, 0x8fe51550, 0xba645bd6, 0x2826a2f9, 0xa73a3ae1,
    0x4ba99586, 0xef5562e9, 0xc72fefd3, 0xf752f7da, 0x3f046f69,
    0x77fa0a59, 0x80e4a915, 0x87b08601, 0x9b09e6ad, 0x3b3ee593,
    0xe990fd5a, 0x9e34d797, 0x2cf0b7d9, 0x022b8b51, 0x96d5ac3a,
    0x017da67d, 0xd1cf3ed6, 0x7c7d2d28, 0x1f9f25cf, 0xadf2b89b,
    0x5ad6b472, 0x5a88f54c, 0xe029ac71, 0xe019a5e6, 0x47b0acfd,
    0xed93fa9b, 0xe8d3c48d, 0x283b57cc, 0xf8d56629, 0x79132e28,
    0x785f0191, 0xed756055, 0xf7960e44, 0xe3d35e8c, 0x15056dd4,
    0x88f46dba, 0x03a16125, 0x0564f0bd, 0xc3eb9e15, 0x3c9057a2,
    0x97271aec, 0xa93a072a, 0x1b3f6d9b, 0x1e6321f5, 0xf59c66fb,
    0x26dcf319, 0x7533d928, 0xb155fdf5, 0x03563482, 0x8aba3cbb,
    0x28517711, 0xc20ad9f8, 0xabcc5167, 0xccad925f, 0x4de81751,
    0x3830dc8e, 0x379d5862, 0x9320f991, 0xea7a90c2, 0xfb3e7bce,
    0x5121ce64, 0x774fbe32, 0xa8b6e37e, 0xc3293d46, 0x48de5369,
    0x6413e680, 0xa2ae0810, 0xdd6db224, 0x69852dfd, 0x09072166,
    0xb39a460a, 0x6445c0dd, 0x586cdecf, 0x1c20c8ae, 0x5bbef7dd,
    0x1b588d40, 0xccd2017f, 0x6bb4e3bb, 0xdda26a7e, 0x3a59ff45,
    0x3e350a44, 0xbcb4cdd5, 0x72eacea8, 0xfa6484bb, 0x8d6612ae,
    0xbf3c6f47, 0xd29be463, 0x542f5d9e, 0xaec2771b, 0xf64e6370,
    0x740e0d8d, 0xe75b1357, 0xf8721671, 0xaf537d5d, 0x4040cb08,
    0x4eb4e2cc, 0x34d2466a, 0x0115af84, 0xe1b00428, 0x95983a1d,
    0x06b89fb4, 0xce6ea048, 0x6f3f3b82, 0x3520ab82, 0x011a1d4b,
    0x277227f8, 0x611560b1, 0xe7933fdc, 0xbb3a792b, 0x344525bd,
    0xa08839e1, 0x51ce794b, 0x2f32c9b7, 0xa01fbac9, 0xe01cc87e,
    0xbcc7d1f6, 0xcf0111c3, 0xa1e8aac7, 0x1a908749, 0xd44fbd9a,
    0xd0dadecb, 0xd50ada38, 0x0339c32a, 0xc6913667, 0x8df9317c,
    0xe0b12b4f, 0xf79e59b7, 0x43f5bb3a, 0xf2d519ff, 0x27d9459c,
    0xbf97222c, 0x15e6fc2a, 0x0f91fc71, 0x9b941525, 0xfae59361,
    0xceb69ceb, 0xc2a86459, 0x12baa8d1, 0xb6c1075e, 0xe3056a0c,
    0x10d25065, 0xcb03a442, 0xe0ec6e0e, 0x1698db3b, 0x4c98a0be,
    0x3278e964, 0x9f1f9532, 0xe0d392df, 0xd3a0342b, 0x8971f21e,
    0x1b0a7441, 0x4ba3348c, 0xc5be7120, 0xc37632d8, 0xdf359f8d,
    0x9b992f2e, 0xe60b6f47, 0x0fe3f11d, 0xe54cda54, 0x1edad891,
    0xce6279cf, 0xcd3e7e6f, 0x1618b166, 0xfd2c1d05, 0x848fd2c5,
    0xf6fb2299, 0xf523f357, 0xa6327623, 0x93a83531, 0x56cccd02,
    0xacf08162, 0x5a75ebb5, 0x6e163697, 0x88d273cc, 0xde966292,
    0x81b949d0, 0x4c50901b, 0x71c65614, 0xe6c6c7bd, 0x327a140a,
    0x45e1d006, 0xc3f27b9a, 0xc9aa53fd, 0x62a80f00, 0xbb25bfe2,
    0x35bdd2f6, 0x71126905, 0xb2040222, 0xb6cbcf7c, 0xcd769c2b,
    0x53113ec0, 0x1640e3d3, 0x38abbd60, 0x2547adf0, 0xba38209c,
    0xf746ce76, 0x77afa1c5, 0x20756060, 0x85cbfe4e, 0x8ae88dd8,
    0x7aaaf9b0, 0x4cf9aa7e, 0x1948c25c, 0x02fb8a8c, 0x01c36ae4,
    0xd6ebe1f9, 0x90d4f869, 0xa65cdea0, 0x3f09252d, 0xc208e69f,
    0xb74e6132, 0xce77e25b, 0x578fdfe3, 0x3ac372e6
];
var C_ORIG = [
    0x4f727068, 0x65616e42, 0x65686f6c, 0x64657253, 0x63727944,
    0x6f756274
];

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("./assert");
var bcrypt = require("./bcrypt");
var utf8_1 = require("./utf8");
var hex = require("./hex");
function bcrypt_test() {
    //These values were verified with a Go program
    var data = hex.decode("445fed2825c2ec37e553eb1809a00f33");
    assert.equal(bcrypt.encodeBcrypt64(data), "PD9rIAVA5BdjS8qWAY.NKu");
    assert.equal(bcrypt.encodeBcrypt64(byteSeq(256)), "..CA.uOD/eaGAOmJB.yMBv.PCfKSDPWVE/iYEvubFf6eGQGhHASkHwenIgqqJQ2tKBCwKxOzLha2MRm5NBy8Ny//OiLCPSXFQCjIQyvLRi7OSTHRTDTUTzfXUjraVT3dWEDgW0PjXkbmYUnpZEzsZ1/valLybVX1cFj4c1v7dl8.eWIBfGUEf2gHgmsKhW4NiHEQi3QTjncWkXoZlH0cl4AfmoMinYYloIkoo4wrpo8uqZIxrJU0r5g3sps6tZ49uKFAu6RDvqdGwapJxK1Mx7BPyrNSzbZV0LlY07xb1r9e2cJh3MVk38hn4stq5c5t6NFw69Rz7td28dp59N189u");
    var pass = utf8_1.stringToUTF8("a");
    var salt = hex.decode("0123456789abcdef0123456789abcdef");
    //raw
    var raw = bcrypt.rawBcrypt(pass, salt, 5);
    assert.equal('60aae91e8f1f09cb912890beacc63141243ac3015b63c2', hex.encode(raw));
    //encoded
    var str = bcrypt.bcrypt(pass, salt, 5);
    assert.equal(str, "$2a$05$.QLDX2kpxc6/GyTlgYtL5uWIpnFm6dAasPIHA8pKWvOQO4uuDZW6G");
    var t1 = performance.now();
    //same inputs, higher cost
    str = bcrypt.bcrypt(pass, salt, 6);
    assert.equal(str, "$2a$06$.QLDX2kpxc6/GyTlgYtL5ukdWCkLLQzVwdT2ZlSdURju9tgHT77rK");
    //"abc"
    pass = utf8_1.stringToUTF8("abc");
    str = bcrypt.bcrypt(pass, salt, 5);
    assert.equal(str, "$2a$05$.QLDX2kpxc6/GyTlgYtL5u8Mo3drJBnT.VV.KJw7oKFBNcZ6aNZ6m");
    //"LuckyThirteen"
    pass = utf8_1.stringToUTF8("LuckyThirteen");
    str = bcrypt.bcrypt(pass, salt, 5);
    assert.equal(str, "$2a$05$.QLDX2kpxc6/GyTlgYtL5uWSLjcofsRF47iQRWuvuljFr5nM8f7MW");
    //random (with all possible nibbles)
    salt = hex.decode("445fed2825c2ec37e553eb1809a00f33");
    pass = hex.decode("ac5b90636c3d805df5efbbd6281a72e4e361cf1d049a7cef24879a728b049153");
    str = bcrypt.bcrypt(pass, salt, 5);
    assert.equal(str, "$2a$05$PD9rIAVA5BdjS8qWAY.NKuO7LX8Qaar1KUIhU.PAm3HUsbk5E2WmG");
    var t2 = performance.now();
    console.log("bcrypt_test took " + (t2 - t1) + "ms");
}
exports.default = bcrypt_test;
function byteSeq(n) {
    var res = new Uint8Array(n);
    for (var i = 0; i < n; i++) {
        res[i] = i & 0xFF;
    }
    return res;
}

},{"./assert":3,"./bcrypt":5,"./hex":11,"./utf8":18}],7:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var sha256 = require("./sha256");
var utf8_1 = require("./utf8");
var util_1 = require("./util");
var HmacCounterByteSource_1 = require("./HmacCounterByteSource");
var bcryptCost_2017a = 13;
var StretchedMaster = (function () {
    function StretchedMaster() {
    }
    return StretchedMaster;
}());
exports.StretchedMaster = StretchedMaster;
var SiteKey = (function () {
    function SiteKey() {
    }
    return SiteKey;
}());
exports.SiteKey = SiteKey;
var SiteCardMix = (function () {
    function SiteCardMix() {
    }
    return SiteCardMix;
}());
exports.SiteCardMix = SiteCardMix;
var PasswordSeed = (function () {
    function PasswordSeed() {
    }
    return PasswordSeed;
}());
exports.PasswordSeed = PasswordSeed;
function isSaneEmail(s) {
    //a@b.c
    return s.length >= 4 && s.indexOf("@") != -1 && s.indexOf(".") != -1;
}
exports.isSaneEmail = isSaneEmail;
var ParallelBcrypt = (function () {
    function ParallelBcrypt() {
    }
    return ParallelBcrypt;
}());
exports.ParallelBcrypt = ParallelBcrypt;
function StretchMasterPassword(plaintextPassword, userEmail, pbcrypt) {
    return __awaiter(this, void 0, void 0, function () {
        var fullSalt, salt16, sm, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (plaintextPassword.length < 8) {
                        throw new Error("password too short");
                    }
                    userEmail = userEmail.trim().toLowerCase();
                    if (!isSaneEmail(userEmail)) {
                        throw new Error("Invalid email address");
                    }
                    fullSalt = utf8_1.stringToUTF8("calcpass2017a " + userEmail);
                    salt16 = sha256.hash(fullSalt).slice(0, 16);
                    sm = new StretchedMaster();
                    _a = sm;
                    return [4 /*yield*/, pbcrypt.execute(4, plaintextPassword, salt16, bcryptCost_2017a, pbcrypt.progressCallback)];
                case 1:
                    _a.bytes = _b.sent();
                    return [2 /*return*/, new Promise(function (resolve) { resolve(sm); })];
            }
        });
    });
}
exports.StretchMasterPassword = StretchMasterPassword;
function MakeSiteKey(stretchedMaster, websiteName, revision) {
    if (!websiteName || websiteName.length < 2) {
        throw new Error("website name too short");
    }
    //ensure integer
    revision = Math.floor(revision);
    if (revision < 0) {
        throw new Error("revision cannot be negative");
    }
    //Ensure websiteName is case insensitive
    // (eg "CalcPass.com" should be hash the same as "calcpass.com")
    websiteName = websiteName.trim().toLowerCase();
    var message = utf8_1.stringToUTF8(websiteName + " " + revision);
    var sk = new SiteKey();
    sk.bytes = sha256.hmac(stretchedMaster.bytes, message);
    return sk;
}
exports.MakeSiteKey = MakeSiteKey;
/**Mix SiteKey and card characters using HmacSha256.*/
function MixSiteAndCard(siteKey, charactersFromCard) {
    //2017a cards are all lower case.  Also trim white space
    charactersFromCard = charactersFromCard.trim().toLowerCase();
    if (charactersFromCard.length < 8) {
        throw new Error("Too few characters from card");
    }
    var rawChars = utf8_1.stringToUTF8(charactersFromCard);
    //verify a-z
    for (var i = 0; i < rawChars.length; i++) {
        if (rawChars[i] < 0x61 || rawChars[i] > 0x7A)
            throw new Error("charactersFromCard must be a through z");
    }
    var mix = new SiteCardMix();
    mix.bytes = sha256.hmac(siteKey.bytes, rawChars);
    util_1.erase(rawChars);
    return mix;
}
exports.MixSiteAndCard = MixSiteAndCard;
function StretchSiteCardMix(siteCardMix, pbcrypt) {
    return __awaiter(this, void 0, void 0, function () {
        var key, salt, ps, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    key = siteCardMix.bytes.slice(0, 16);
                    salt = siteCardMix.bytes.slice(16);
                    ps = new PasswordSeed();
                    _a = ps;
                    return [4 /*yield*/, pbcrypt.execute(4, key, salt, bcryptCost_2017a, pbcrypt.progressCallback)];
                case 1:
                    _a.bytes = _b.sent();
                    return [2 /*return*/, new Promise(function (resolve) { resolve(ps); })];
            }
        });
    });
}
exports.StretchSiteCardMix = StretchSiteCardMix;
function MakeFriendlyPassword12a(seed) {
    var rng = new HmacCounterByteSource_1.HmacCounterByteSource(seed.bytes, 128);
    var chars = '';
    var b;
    var ascii_a = 0x61;
    var ascii_A = 0x41;
    var ascii_0 = 0x30;
    //Select 11 a-z characters
    for (var i = 0; i < 11; i++) {
        b = util_1.UnbiasedSmallInt(rng, 26);
        //Capitalize the first char
        if (i == 0) {
            chars += String.fromCharCode(ascii_A + b);
        }
        else {
            chars += String.fromCharCode(ascii_a + b);
        }
    }
    //Select 0-9
    b = util_1.UnbiasedSmallInt(rng, 10);
    chars += String.fromCharCode(b + ascii_0);
    return chars;
}
exports.MakeFriendlyPassword12a = MakeFriendlyPassword12a;
var CARD_xNames = "ABCDEFGHJKLMNPQRSTUVWX"; //skip I and O to avoid ambiguity when rendered with certain fonts
var CARD_W = 22;
var CARD_H = 15;
function xNameFunc(index) {
    if (index >= CARD_xNames.length) {
        throw new Error("XName index out of range");
    }
    return CARD_xNames[index];
}
function yNameFunc(index) {
    return (index + 1).toString();
}
var CardCoord = (function () {
    function CardCoord() {
    }
    CardCoord.prototype.toString = function () {
        //number then letter
        return this.HumanY + this.HumanX;
    };
    return CardCoord;
}());
function makeCardCoordinatesFromSource(src, count, cardSizeX, cardSizeY, xNameFunc, yNameFunc) {
    var coords = new Array(count);
    var coord;
    for (var i = 0; i < count; i++) {
        coord = new CardCoord();
        coord.X = util_1.UnbiasedSmallInt(src, cardSizeX);
        coord.Y = util_1.UnbiasedSmallInt(src, cardSizeY);
        coord.HumanX = xNameFunc(coord.X);
        coord.HumanY = yNameFunc(coord.Y);
        coords[i] = coord;
    }
    return coords;
}
function MakeSiteCoordinates(siteKey, count) {
    if (count < 1 || count > 100) {
        throw new Error("invalid coordinate count");
    }
    var src = new HmacCounterByteSource_1.HmacCounterByteSource(siteKey.bytes, 128);
    return makeCardCoordinatesFromSource(src, count, CARD_W, CARD_H, xNameFunc, yNameFunc);
}
exports.MakeSiteCoordinates = MakeSiteCoordinates;

},{"./HmacCounterByteSource":1,"./sha256":15,"./utf8":18,"./util":20}],8:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("./assert");
var hex = require("./hex");
var sha256 = require("./sha256");
var utf8_1 = require("./utf8");
var util_1 = require("./util");
var calcpass2017a = require("./calcpass2017a");
var execute_parallel_bcrypt_webworkers_1 = require("./execute_parallel_bcrypt_webworkers");
function emptyPromise() {
    return new Promise(function (resolve) { resolve(true); });
}
//returns a ParallelBcrypt object
function setup_bcrypt() {
    var pbcrypt = new calcpass2017a.ParallelBcrypt();
    pbcrypt.execute = execute_parallel_bcrypt_webworkers_1.execute_parallel_bcrypt_webworkers;
    var lastPercent = 0.0;
    pbcrypt.progressCallback = function (percent) {
        if ((percent - lastPercent) >= 0.25 || percent == 1.0) {
            lastPercent = percent;
            console.log('  ' + Math.floor(percent * 100.0) + '%');
        }
    };
    return pbcrypt;
}
function Test_StretchMasterPassword() {
    return __awaiter(this, void 0, void 0, function () {
        var pass, sm;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pass = utf8_1.stringToUTF8('Hello World');
                    console.log('  stretching...');
                    return [4 /*yield*/, calcpass2017a.StretchMasterPassword(pass, 'a@b.c', setup_bcrypt())];
                case 1:
                    sm = _a.sent();
                    assert.equal(hex.encode(sm.bytes), "f60f7cd075e3242879d04f3f10546f2cd5c2c1ab7790d466f9bca47864dfcce0");
                    return [2 /*return*/, emptyPromise()];
            }
        });
    });
}
function Test_MakeSiteKey() {
    var stretchedMaster = new calcpass2017a.StretchedMaster();
    stretchedMaster.bytes = util_1.byteSeq(1, 32);
    var sitekey = calcpass2017a.MakeSiteKey(stretchedMaster, " \t\nExAmPle.CoM \r", 0);
    assert.equal(hex.encode(sitekey.bytes), "6c95536db40ee491011c5159a5990e39a5ff09dae396559fe7b2413c4308bc62");
}
function Test_MixSiteAndCard() {
    var sitekey = new calcpass2017a.SiteKey();
    sitekey.bytes = util_1.byteSeq(1, 32);
    var mixed = calcpass2017a.MixSiteAndCard(sitekey, " \n\tQwErTyUi \r\t");
    assert.equal(hex.encode(mixed.bytes), "6e8c0b5448f31396a04b1139b0ec43308e55192340610a564107bfde8dccc8dc");
}
function Test_StretchSiteCardMix() {
    return __awaiter(this, void 0, void 0, function () {
        var mixed, pwseed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mixed = new calcpass2017a.SiteCardMix();
                    mixed.bytes = util_1.byteSeq(1, 32);
                    console.log('  stretching...');
                    return [4 /*yield*/, calcpass2017a.StretchSiteCardMix(mixed, setup_bcrypt())];
                case 1:
                    pwseed = _a.sent();
                    assert.equal(hex.encode(pwseed.bytes), "0fb2c41f1a71834186bc515889f881d892efcd248eabf88ff68abfa7afdc6df7");
                    return [2 /*return*/, emptyPromise()];
            }
        });
    });
}
function Test_MakeFriendlyPassword12a() {
    var seed = new calcpass2017a.PasswordSeed();
    seed.bytes = util_1.byteSeq(1, 32);
    assert.equal(calcpass2017a.MakeFriendlyPassword12a(seed), 'Scvqduejxmm5');
    //change seed
    seed.bytes[31]++;
    assert.equal(calcpass2017a.MakeFriendlyPassword12a(seed), 'Ikvruuyldov1');
    //checksum of 20 different seeds (verified against Go program)
    seed.bytes = util_1.byteSeq(1, 32);
    var sha = new sha256.Hash();
    var pass;
    var j = 0;
    for (var i = 0; i < 20; i++) {
        //modify seed
        seed.bytes[j % 32]++;
        j++;
        pass = calcpass2017a.MakeFriendlyPassword12a(seed);
        sha.update(utf8_1.stringToUTF8(pass));
    }
    assert.equal(hex.encode(sha.digest()), '008634126acab8fdd6c34f123495a8d2d3ae9cd073e705cd12d506d71e63234a');
}
function Test_MakeSiteCoordinates() {
    var sitekey = new calcpass2017a.SiteKey();
    sitekey.bytes = util_1.byteSeq(1, 32);
    var coords = calcpass2017a.MakeSiteCoordinates(sitekey, 2);
    assert.equal(coords.length, 2);
    assert.equal(coords[0].toString(), "13A");
    assert.equal(coords[1].toString(), "8M");
    //change key
    sitekey.bytes[31]++;
    coords = calcpass2017a.MakeSiteCoordinates(sitekey, 2);
    assert.equal(coords.length, 2);
    assert.equal(coords[0].toString(), "8S");
    assert.equal(coords[1].toString(), "13E");
}
function calcpass2017a_test() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assert.isTrue(calcpass2017a.isSaneEmail('a@b.c'));
                    Test_MakeSiteKey();
                    Test_MixSiteAndCard();
                    Test_MakeFriendlyPassword12a();
                    Test_MakeSiteCoordinates();
                    return [4 /*yield*/, Test_StretchMasterPassword()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Test_StretchSiteCardMix()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, emptyPromise()];
            }
        });
    });
}
exports.calcpass2017a_test = calcpass2017a_test;

},{"./assert":3,"./calcpass2017a":7,"./execute_parallel_bcrypt_webworkers":9,"./hex":11,"./sha256":15,"./utf8":18,"./util":20}],9:[function(require,module,exports){
/**Spawn Web Worker threads to compute part of the parallel bcrypt hash.*/
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var parallel_bcrypt = require("./parallel_bcrypt");
var hex = require("./hex");
function execute_parallel_bcrypt_webworkers(numThreads, plaintextPassword, salt, cost, progressCallback) {
    return __awaiter(this, void 0, void 0, function () {
        var threadPasswords, i, saltHex, promiseCallbacks, promise, failed, nWorkersDone, workerHashes, lastReportedPercent, onAllWorkersDone, onMessageFromWorker, onErrorFromWorker, workers, randint, _loop_1, msg;
        return __generator(this, function (_a) {
            threadPasswords = new Array(numThreads);
            for (i = 0; i < numThreads; i++) {
                threadPasswords[i] = parallel_bcrypt.createDistinctThreadPassword(i, plaintextPassword);
            }
            saltHex = hex.encode(salt);
            promiseCallbacks = {
                resolve: null,
                reject: null
            };
            promise = new Promise(function (resolve, reject) {
                promiseCallbacks.resolve = resolve;
                promiseCallbacks.reject = reject;
            });
            failed = false;
            nWorkersDone = 0;
            workerHashes = new Array(numThreads);
            lastReportedPercent = 0.0;
            onAllWorkersDone = function () {
                var finalHash;
                try {
                    finalHash = parallel_bcrypt.combineThreadHashes(workerHashes);
                    progressCallback(1.0);
                }
                catch (e) {
                    failed = true;
                    promiseCallbacks.reject(e);
                    return;
                }
                promiseCallbacks.resolve(finalHash);
            };
            onMessageFromWorker = function (workerInstance, e) {
                if (!failed) {
                    var threadIndex = e.data.threadIndex;
                    if (e.data.PROGRESS) {
                        var percent = e.data.percent * 0.99; //reserve the last percent for combineThreadHashes()
                        //report the average percent
                        //threadPercents[threadIndex] = percent;
                        //let avg = 0.0;
                        //let i:number;
                        //for (i = 0; i < threadPercents.length; i++)
                        //	avg += threadPercents[i];
                        //percent = avg / threadPercents.length;
                        //avoid excessive progress reports - only report in 2% increments
                        if (percent - lastReportedPercent >= 0.02 || percent >= 1.0) {
                            progressCallback(percent);
                            lastReportedPercent = percent;
                        }
                    }
                    else if (e.data.DONE) {
                        workerHashes[threadIndex] = e.data.hash;
                        nWorkersDone++;
                        //All are done?
                        if (nWorkersDone == numThreads)
                            onAllWorkersDone();
                    }
                }
            };
            onErrorFromWorker = function (workerInstance, error) {
                //only reject upon the first error
                if (!failed) {
                    failed = true;
                    var msg = 'parallel bcrypt worker failed: ' + error.message +
                        ' (line ' + error.lineno + ' of ' + error.filename + ')';
                    promiseCallbacks.reject(msg);
                }
            };
            workers = new Array(numThreads);
            randint = Math.floor(Math.random() * 10000000);
            _loop_1 = function () {
                var worker = new Worker('parallel-bcrypt-webworker.js?cachebust=' + randint);
                worker.onmessage = function (e) {
                    onMessageFromWorker(worker, e);
                };
                worker.onerror = function (err) {
                    onErrorFromWorker(worker, err);
                };
                workers[i] = worker;
            };
            for (i = 0; i < numThreads; i++) {
                _loop_1();
            }
            //Start each worker
            for (i = 0; i < numThreads; i++) {
                msg = {
                    START: true,
                    threadIndex: i,
                    distinctThreadPasswordAsHex: threadPasswords[i],
                    saltHex: saltHex,
                    cost: cost,
                    //only request progress from the last thread.
                    //this avoids excessive thread messaging which
                    //shaves off about 200ms on my (slow) laptop.
                    //I'm assuming that the last thread launched will
                    //usually be the last to finish.
                    reportProgress: i == (numThreads - 1),
                };
                workers[i].postMessage(msg);
            }
            return [2 /*return*/, promise];
        });
    });
}
exports.execute_parallel_bcrypt_webworkers = execute_parallel_bcrypt_webworkers;

},{"./hex":11,"./parallel_bcrypt":13}],10:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("./assert");
var hex = require("./hex");
var utf8_1 = require("./utf8");
var execute_parallel_bcrypt_webworkers_1 = require("./execute_parallel_bcrypt_webworkers");
function execute_parallel_bcrypt_webworkers_test() {
    return __awaiter(this, void 0, void 0, function () {
        var salt, pass, lastPercent, progFunc, hash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    salt = new Uint8Array([0x71, 0xd7, 0x9f, 0x82, 0x18, 0xa3, 0x92, 0x59, 0xa7, 0xa2, 0x9a, 0xab, 0xb2, 0xdb, 0xaf, 0xc3]);
                    pass = utf8_1.stringToUTF8("Super Secret Password");
                    lastPercent = 0.0;
                    progFunc = function (percent) {
                        lastPercent = percent;
                    };
                    return [4 /*yield*/, execute_parallel_bcrypt_webworkers_1.execute_parallel_bcrypt_webworkers(4, pass, salt, 5, progFunc)];
                case 1:
                    hash = _a.sent();
                    assert.equal(hex.encode(hash), "2c70a99f125eaa36561e97f0c9d215e099ab991116ceda19b7c3c93c669ebe7e");
                    assert.equal(1.0, lastPercent);
                    return [2 /*return*/, new Promise(function (resolve) { resolve(true); })];
            }
        });
    });
}
exports.execute_parallel_bcrypt_webworkers_test = execute_parallel_bcrypt_webworkers_test;

},{"./assert":3,"./execute_parallel_bcrypt_webworkers":9,"./hex":11,"./utf8":18}],11:[function(require,module,exports){
/**Convert arrays of octets to and from hex strings*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function encode(octetArray) {
    return _encode(octetArray);
}
exports.encode = encode;
function _encode(anyArray) {
    var s = '';
    var tmp, b;
    for (var i = 0; i < anyArray.length; i++) {
        b = anyArray[i];
        if (typeof (b) !== 'number' || b < 0 || b > 255)
            throw new Error('Invalid octet at index ' + i);
        tmp = b.toString(16);
        if (tmp.length == 1)
            s += '0';
        s += tmp;
    }
    return s;
}
exports._encode = _encode;
/**Return a byte array of ASCII character values instead of a string.*/
function encodeToUint8Array(octets) {
    //ASCII 0-9 a-f	
    var chars = [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66];
    var res = new Uint8Array(octets.length * 2);
    var j = 0;
    var b;
    for (var i = 0; i < octets.length; i++) {
        b = octets[i];
        res[j++] = chars[b >> 4];
        res[j++] = chars[b & 0x0f];
    }
    return res;
}
exports.encodeToUint8Array = encodeToUint8Array;
function decode(str) {
    if (typeof (str) !== 'string')
        throw new Error('expected string');
    if (str.length % 2 != 0)
        throw new Error('hex.decode: string length is not even!');
    //Verify all characters are valid.  (parseInt ignores problems)
    var re = /^[a-fA-F0-9]*$/;
    if (!re.test(str))
        throw new Error('hex.decode: invalid hex');
    var res = new Uint8Array(str.length / 2);
    for (var i = 0; i < str.length; i += 2) {
        res[i >> 1] = parseInt(str.substring(i, i + 2), 16);
    }
    return res;
}
exports.decode = decode;

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var hex = require("./hex");
var assert = require("./assert");
function byteSeq(n) {
    var res = new Uint8Array(n);
    for (var i = 0; i < n; i++) {
        res[i] = i & 0xFF;
    }
    return res;
}
function hex_test() {
    var ar = hex.decode('5A');
    assert.equalArray(ar, [0x5a]);
    assert.equal(hex.encode(ar), '5a');
    //empty is valid
    assert.equalArray(hex.decode(''), []);
    assert.equal(hex.encode(new Uint8Array(0)), '');
    assert.throws(function () { return hex.decode('a'); });
    assert.throws(function () { return hex.decode('aaa'); });
    assert.throws(function () { return hex.decode('a?'); });
    assert.throws(function () { return hex.decode('5A '); });
    //0-255
    var allStr = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff";
    var all = byteSeq(256);
    assert.equalArray(hex.decode(allStr), all);
    assert.equal(hex.encode(all), allStr);
    //test encodeToUint8Array
    var allRaw = hex.encodeToUint8Array(all);
    var i;
    assert.equal(allRaw.length, 512);
    var s = '';
    for (i = 0; i < allRaw.length; i++) {
        s += String.fromCharCode(allRaw[i]);
    }
    assert.equal(s, allStr);
}
exports.default = hex_test;

},{"./assert":3,"./hex":11}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bcrypt = require("./bcrypt");
var utf8_1 = require("./utf8");
var sha256 = require("./sha256");
var hex = require("./hex");
function checkParams(plaintextPassword, salt, cost) {
    if (!plaintextPassword.length)
        throw new Error("parallel_bcrypt: empty password!");
    if (salt.length != bcrypt.saltSize)
        throw new Error("parallel_bcrypt: wrong salt length. bcrypt requires " + bcrypt.saltSize + " bytes");
    if (cost < 4 || cost > 32)
        throw new Error("parallel_bcrypt: bcrypt cost must be between 4 and 32.");
}
/**Derive a distinct password for each thread to work on.  This
returns a 64 character hex string.*/
function createDistinctThreadPassword(threadIndex, plaintextPassword) {
    if (!plaintextPassword.length)
        throw new Error("parallel_bcrypt: empty password!");
    var threadPassword = sha256.hmac(plaintextPassword, new Uint8Array([threadIndex + 1]));
    return hex.encode(threadPassword);
}
exports.createDistinctThreadPassword = createDistinctThreadPassword;
function bcryptDistinctHex(distinctThreadPasswordAsHex, salt, cost, progressCallback) {
    checkParams(new Uint8Array([1]), salt, cost);
    if (distinctThreadPasswordAsHex.length !== 64)
        throw new Error('Invalid distinctThreadPasswordAsHex');
    //Hash it!
    var hash64 = bcrypt.bcrypt(utf8_1.stringToUTF8(distinctThreadPasswordAsHex), salt, cost, progressCallback);
    if (hash64.length != 60)
        throw new Error("bcrypt returned wrong size");
    //remove the salt and cost prefix (first 29 chars)
    hash64 = hash64.substring(29);
    return hash64;
}
exports.bcryptDistinctHex = bcryptDistinctHex;
/**Do both createDistinctThreadPassword() and bcryptDistinctHex()*/
function hashThread(threadIndex, plaintextPassword, salt, cost) {
    checkParams(plaintextPassword, salt, cost);
    if (threadIndex < 0)
        throw new Error('Negative threadIndex');
    var threadPasswordHex = createDistinctThreadPassword(threadIndex, plaintextPassword);
    return bcryptDistinctHex(threadPasswordHex, salt, cost);
}
exports.hashThread = hashThread;
/**
@param hashes the hash result from each thread, sorted by thread index ascending.
Always returns 32 bytes.
*/
function combineThreadHashes(hashes) {
    if (!hashes.length) {
        throw new Error("parallel_bcrypt: empty array!");
    }
    var sha = new sha256.Hash();
    var i;
    for (i = 0; i < hashes.length; i++) {
        if (hashes[i].length != 31)
            throw new Error("parallel_bcrypt: wrong hash string length.");
        sha.update(utf8_1.stringToUTF8(hashes[i]));
    }
    var res = sha.digest();
    sha.clean();
    return res;
}
exports.combineThreadHashes = combineThreadHashes;
/**Compute the full hash using only a single thread (slow!).  This is mainly for unit testing - normally
you will want to spawn Web Workers which call hashThread().
*/
function hashWithSingleThread(numSimulatedThreads, plaintextPassword, salt, cost) {
    checkParams(plaintextPassword, salt, cost);
    if (numSimulatedThreads < 1 || numSimulatedThreads > 64)
        throw new Error("parallel_bcrypt: numSimulatedThreads out of range.");
    var hashes = new Array(numSimulatedThreads);
    for (var n = 0; n < numSimulatedThreads; n++) {
        hashes[n] = hashThread(n, plaintextPassword, salt, cost);
    }
    return combineThreadHashes(hashes);
}
exports.hashWithSingleThread = hashWithSingleThread;

},{"./bcrypt":5,"./hex":11,"./sha256":15,"./utf8":18}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("./assert");
var bcrypt = require("./bcrypt");
var parallel_bcrypt = require("./parallel_bcrypt");
var utf8_1 = require("./utf8");
var hex = require("./hex");
function test_bcrypt_implementation() {
    //"abcdefghijklmnopqrstuu" as bcrypt-base64
    var salt = new Uint8Array([0x71, 0xd7, 0x9f, 0x82, 0x18, 0xa3, 0x92, 0x59, 0xa7, 0xa2, 0x9a, 0xab, 0xb2, 0xdb, 0xaf, 0xc3]);
    //parallel_bcrypt avoids sending 0x00 bytes to bcrypt because some
    // implementations truncate upon the first null byte! (eg PHP)
    //Verify that the bcrypt implementation can handle non-printable bytes
    var pass = new Uint8Array([0x01, 0x02, 0x03, 0x7f, 0x80, 0x81, 0xAB, 0xCD, 0xef, 0xff]);
    var hash = bcrypt.bcrypt(pass, salt, 5);
    assert.equal(hash, "$2a$05$abcdefghijklmnopqrstuuu18bGopDo9r1tDNZl2p2xd1YzcTrTp6");
    //parallel_bcrypt sends up to 64 bytes to bcrypt.  Prove that the
    // implementation does not truncate it.
    pass = utf8_1.stringToUTF8("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    hash = bcrypt.bcrypt(pass, salt, 5);
    assert.equal(hash, "$2a$05$abcdefghijklmnopqrstuusN64mi0Q3MHT4E2PLNsVMiw2Jh1hNE6");
    pass = utf8_1.stringToUTF8("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab");
    hash = bcrypt.bcrypt(pass, salt, 5);
    assert.equal(hash, "$2a$05$abcdefghijklmnopqrstuulBPHoU3/c65NkXOJMDkVnN3KklTvm1a");
    //the above results were verified with PHP's bcrypt
}
function parallel_bcrypt_test() {
    test_bcrypt_implementation();
    //"abcdefghijklmnopqrstuu" as bcrypt-base64
    var salt = new Uint8Array([0x71, 0xd7, 0x9f, 0x82, 0x18, 0xa3, 0x92, 0x59, 0xa7, 0xa2, 0x9a, 0xab, 0xb2, 0xdb, 0xaf, 0xc3]);
    //this result was verified with PHP's bcrypt
    var expect = "2c70a99f125eaa36561e97f0c9d215e099ab991116ceda19b7c3c93c669ebe7e";
    var pass = utf8_1.stringToUTF8("Super Secret Password");
    var hash = parallel_bcrypt.hashWithSingleThread(4, pass, salt, 5);
    assert.equal(hash.length, 32);
    assert.equal(hex.encode(hash), expect);
}
exports.default = parallel_bcrypt_test;

},{"./assert":3,"./bcrypt":5,"./hex":11,"./parallel_bcrypt":13,"./utf8":18}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//Copied from: https://github.com/dchest/fast-sha256-js
//
// SHA-256 (+ HMAC and PBKDF2) for JavaScript.
//
// Written in 2014-2016 by Dmitry Chestnykh.
// Public domain, no warranty.
//
// Functions (accept and return Uint8Arrays):
//
//   sha256(message) -> hash
//   sha256.hmac(key, message) -> mac
//   sha256.pbkdf2(password, salt, rounds, dkLen) -> dk
//
//  Classes:
//
//   new sha256.Hash()
//   new sha256.HMAC(key)
//
exports.digestLength = 32;
exports.blockSize = 64;
// SHA-256 constants
var K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
    0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
    0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
    0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
    0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
    0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
function hashBlocks(w, v, p, pos, len) {
    var a, b, c, d, e, f, g, h, u, i, j, t1, t2;
    while (len >= 64) {
        a = v[0];
        b = v[1];
        c = v[2];
        d = v[3];
        e = v[4];
        f = v[5];
        g = v[6];
        h = v[7];
        for (i = 0; i < 16; i++) {
            j = pos + i * 4;
            w[i] = (((p[j] & 0xff) << 24) | ((p[j + 1] & 0xff) << 16) |
                ((p[j + 2] & 0xff) << 8) | (p[j + 3] & 0xff));
        }
        for (i = 16; i < 64; i++) {
            u = w[i - 2];
            t1 = (u >>> 17 | u << (32 - 17)) ^ (u >>> 19 | u << (32 - 19)) ^ (u >>> 10);
            u = w[i - 15];
            t2 = (u >>> 7 | u << (32 - 7)) ^ (u >>> 18 | u << (32 - 18)) ^ (u >>> 3);
            w[i] = (t1 + w[i - 7] | 0) + (t2 + w[i - 16] | 0);
        }
        for (i = 0; i < 64; i++) {
            t1 = (((((e >>> 6 | e << (32 - 6)) ^ (e >>> 11 | e << (32 - 11)) ^
                (e >>> 25 | e << (32 - 25))) + ((e & f) ^ (~e & g))) | 0) +
                ((h + ((K[i] + w[i]) | 0)) | 0)) | 0;
            t2 = (((a >>> 2 | a << (32 - 2)) ^ (a >>> 13 | a << (32 - 13)) ^
                (a >>> 22 | a << (32 - 22))) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
            h = g;
            g = f;
            f = e;
            e = (d + t1) | 0;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) | 0;
        }
        v[0] += a;
        v[1] += b;
        v[2] += c;
        v[3] += d;
        v[4] += e;
        v[5] += f;
        v[6] += g;
        v[7] += h;
        pos += 64;
        len -= 64;
    }
    return pos;
}
// Hash implements SHA256 hash algorithm.
var Hash = (function () {
    function Hash() {
        this.digestLength = exports.digestLength;
        this.blockSize = exports.blockSize;
        // Note: Int32Array is used instead of Uint32Array for performance reasons.
        this.state = new Int32Array(8); // hash state
        this.temp = new Int32Array(64); // temporary state
        this.buffer = new Uint8Array(128); // buffer for data to hash
        this.bufferLength = 0; // number of bytes in buffer
        this.bytesHashed = 0; // number of total bytes hashed
        this.finished = false; // indicates whether the hash was finalized
        this.reset();
    }
    // Resets hash state making it possible
    // to re-use this instance to hash other data.
    Hash.prototype.reset = function () {
        this.state[0] = 0x6a09e667;
        this.state[1] = 0xbb67ae85;
        this.state[2] = 0x3c6ef372;
        this.state[3] = 0xa54ff53a;
        this.state[4] = 0x510e527f;
        this.state[5] = 0x9b05688c;
        this.state[6] = 0x1f83d9ab;
        this.state[7] = 0x5be0cd19;
        this.bufferLength = 0;
        this.bytesHashed = 0;
        this.finished = false;
        return this;
    };
    // Cleans internal buffers and re-initializes hash state.
    Hash.prototype.clean = function () {
        for (var i = 0; i < this.buffer.length; i++) {
            this.buffer[i] = 0;
        }
        for (var i = 0; i < this.temp.length; i++) {
            this.temp[i] = 0;
        }
        this.reset();
    };
    // Updates hash state with the given data.
    //
    // Optionally, length of the data can be specified to hash
    // fewer bytes than data.length.
    //
    // Throws error when trying to update already finalized hash:
    // instance must be reset to use it again.
    Hash.prototype.update = function (data, dataLength) {
        if (dataLength === void 0) { dataLength = data.length; }
        if (this.finished) {
            throw new Error("SHA256: can't update because hash was finished.");
        }
        var dataPos = 0;
        this.bytesHashed += dataLength;
        if (this.bufferLength > 0) {
            while (this.bufferLength < 64 && dataLength > 0) {
                this.buffer[this.bufferLength++] = data[dataPos++];
                dataLength--;
            }
            if (this.bufferLength === 64) {
                hashBlocks(this.temp, this.state, this.buffer, 0, 64);
                this.bufferLength = 0;
            }
        }
        if (dataLength >= 64) {
            dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
            dataLength %= 64;
        }
        while (dataLength > 0) {
            this.buffer[this.bufferLength++] = data[dataPos++];
            dataLength--;
        }
        return this;
    };
    // Finalizes hash state and puts hash into out.
    //
    // If hash was already finalized, puts the same value.
    Hash.prototype.finish = function (out) {
        if (!this.finished) {
            var bytesHashed = this.bytesHashed;
            var left = this.bufferLength;
            var bitLenHi = (bytesHashed / 0x20000000) | 0;
            var bitLenLo = bytesHashed << 3;
            var padLength = (bytesHashed % 64 < 56) ? 64 : 128;
            this.buffer[left] = 0x80;
            for (var i = left + 1; i < padLength - 8; i++) {
                this.buffer[i] = 0;
            }
            this.buffer[padLength - 8] = (bitLenHi >>> 24) & 0xff;
            this.buffer[padLength - 7] = (bitLenHi >>> 16) & 0xff;
            this.buffer[padLength - 6] = (bitLenHi >>> 8) & 0xff;
            this.buffer[padLength - 5] = (bitLenHi >>> 0) & 0xff;
            this.buffer[padLength - 4] = (bitLenLo >>> 24) & 0xff;
            this.buffer[padLength - 3] = (bitLenLo >>> 16) & 0xff;
            this.buffer[padLength - 2] = (bitLenLo >>> 8) & 0xff;
            this.buffer[padLength - 1] = (bitLenLo >>> 0) & 0xff;
            hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
            this.finished = true;
        }
        for (var i = 0; i < 8; i++) {
            out[i * 4 + 0] = (this.state[i] >>> 24) & 0xff;
            out[i * 4 + 1] = (this.state[i] >>> 16) & 0xff;
            out[i * 4 + 2] = (this.state[i] >>> 8) & 0xff;
            out[i * 4 + 3] = (this.state[i] >>> 0) & 0xff;
        }
        return this;
    };
    // Returns the final hash digest.
    Hash.prototype.digest = function () {
        var out = new Uint8Array(this.digestLength);
        this.finish(out);
        return out;
    };
    // Internal function for use in HMAC for optimization.
    Hash.prototype._saveState = function (out) {
        for (var i = 0; i < this.state.length; i++) {
            out[i] = this.state[i];
        }
    };
    // Internal function for use in HMAC for optimization.
    Hash.prototype._restoreState = function (from, bytesHashed) {
        for (var i = 0; i < this.state.length; i++) {
            this.state[i] = from[i];
        }
        this.bytesHashed = bytesHashed;
        this.finished = false;
        this.bufferLength = 0;
    };
    return Hash;
}());
exports.Hash = Hash;
// HMAC implements HMAC-SHA256 message authentication algorithm.
var HMAC = (function () {
    function HMAC(key) {
        this.inner = new Hash();
        this.outer = new Hash();
        this.blockSize = this.inner.blockSize;
        this.digestLength = this.inner.digestLength;
        var pad = new Uint8Array(this.blockSize);
        if (key.length > this.blockSize) {
            (new Hash()).update(key).finish(pad).clean();
        }
        else {
            for (var i = 0; i < key.length; i++) {
                pad[i] = key[i];
            }
        }
        for (var i = 0; i < pad.length; i++) {
            pad[i] ^= 0x36;
        }
        this.inner.update(pad);
        for (var i = 0; i < pad.length; i++) {
            pad[i] ^= 0x36 ^ 0x5c;
        }
        this.outer.update(pad);
        this.istate = new Uint32Array(8);
        this.ostate = new Uint32Array(8);
        this.inner._saveState(this.istate);
        this.outer._saveState(this.ostate);
        for (var i = 0; i < pad.length; i++) {
            pad[i] = 0;
        }
    }
    // Returns HMAC state to the state initialized with key
    // to make it possible to run HMAC over the other data with the same
    // key without creating a new instance.
    HMAC.prototype.reset = function () {
        this.inner._restoreState(this.istate, this.inner.blockSize);
        this.outer._restoreState(this.ostate, this.outer.blockSize);
        return this;
    };
    // Cleans HMAC state.
    HMAC.prototype.clean = function () {
        for (var i = 0; i < this.istate.length; i++) {
            this.ostate[i] = this.istate[i] = 0;
        }
        this.inner.clean();
        this.outer.clean();
    };
    // Updates state with provided data.
    HMAC.prototype.update = function (data) {
        this.inner.update(data);
        return this;
    };
    // Finalizes HMAC and puts the result in out.
    HMAC.prototype.finish = function (out) {
        if (this.outer.finished) {
            this.outer.finish(out);
        }
        else {
            this.inner.finish(out);
            this.outer.update(out, this.digestLength).finish(out);
        }
        return this;
    };
    // Returns message authentication code.
    HMAC.prototype.digest = function () {
        var out = new Uint8Array(this.digestLength);
        this.finish(out);
        return out;
    };
    return HMAC;
}());
exports.HMAC = HMAC;
// Returns SHA256 hash of data.
function hash(data) {
    var h = (new Hash()).update(data);
    var digest = h.digest();
    h.clean();
    return digest;
}
exports.hash = hash;
// Function hash is both available as module.hash and as default export.
exports.default = hash;
// Returns HMAC-SHA256 of data under the key.
function hmac(key, data) {
    var h = (new HMAC(key)).update(data);
    var digest = h.digest();
    h.clean();
    return digest;
}
exports.hmac = hmac;
//adamb: this is commented out because I don't need it for calcpass and want to minimise footprint
// Derives a key from password and salt using PBKDF2-HMAC-SHA256
// with the given number of iterations.
//
// The number of bytes returned is equal to dkLen.
//
// (For better security, avoid dkLen greater than hash length - 32 bytes).
/*export function pbkdf2(password: Uint8Array, salt: Uint8Array, iterations: number, dkLen: number) {
    const prf = new HMAC(password);
    const len = prf.digestLength;
    const ctr = new Uint8Array(4);
    const t = new Uint8Array(len);
    const u = new Uint8Array(len);
    const dk = new Uint8Array(dkLen);

    for (let i = 0; i * len < dkLen; i++) {
        let c = i + 1;
        ctr[0] = (c >>> 24) & 0xff;
        ctr[1] = (c >>> 16) & 0xff;
        ctr[2] = (c >>> 8)  & 0xff;
        ctr[3] = (c >>> 0)  & 0xff;
        prf.reset();
        prf.update(salt);
        prf.update(ctr);
        prf.finish(u);
        for (let j = 0; j < len; j++) {
            t[j] = u[j];
        }
        for (let j = 2; j <= iterations; j++) {
            prf.reset();
            prf.update(u).finish(u);
            for (let k = 0; k < len; k++) {
                t[k] ^= u[k];
            }
        }
        for (let j = 0; j < len && i * len + j < dkLen; j++) {
            dk[i * len + j] = t[j];
        }
    }
    for (let i = 0; i < len; i++) {
        t[i] = u[i] = 0;
    }
    for (let i = 0; i < 4; i++) {
        ctr[i] = 0;
    }
    prf.clean();
    return dk;
}*/

},{}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sha256 = require("./sha256");
var assert = require("./assert");
var utf8_1 = require("./utf8");
var hex = require("./hex");
function sha256Hex(data) {
    return hex.encode(sha256.hash(data));
}
function hmacSha256Hex(key, data) {
    return hex.encode(sha256.hmac(key, data));
}
function reverseByteSeq(n) {
    var res = new Uint8Array(n);
    for (var i = 0; i < n; i++) {
        res[i] = 0xFF - (i & 0xFF);
    }
    return res;
}
function byteSeq(n) {
    var res = new Uint8Array(n);
    for (var i = 0; i < n; i++) {
        res[i] = i & 0xFF;
    }
    return res;
}
function sha256_test() {
    //These test vectors were generated by the Python3 program at the end of this file.
    //
    // sha256
    assert.equal(sha256Hex(utf8_1.stringToUTF8('a')), 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb');
    assert.equal(sha256Hex(utf8_1.stringToUTF8('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.equal(sha256Hex(reverseByteSeq(256)), 'cd6816b77f68d70001fc3eaa4d42bdd67cb5973b3151cc5292ecc02a3daac6ab');
    //
    // hmac
    assert.equal(hmacSha256Hex(reverseByteSeq(256), utf8_1.stringToUTF8('Hello World')), '9174b4b3063d7c82d47c631c75e8c3f10e8b3983d7d65473920156256f7c0526');
    //
    // hmac with input sizes 1-65
    var N = 65;
    var firstBytes = hex.decode('b5676001b8e90fcdac47d9cf046eb3a1ab79c34f84319981452153317e4f68d0631e8adf308241f5a80dd39f958d7c95388457d46641ce8bb14f340060c25acc38');
    var allResults = new Uint8Array(N * sha256.digestLength);
    for (var i = 0; i < N; i++) {
        var inputSize = i + 1;
        var key = reverseByteSeq(inputSize);
        var msg = byteSeq(inputSize);
        var res = sha256.hmac(key, msg);
        assert.equal(res.length, sha256.digestLength);
        assert.equal(res[0], firstBytes[i]);
        //append result to allResults
        allResults.set(res, i * sha256.digestLength);
    }
    //hash of all results
    assert.equal(sha256Hex(allResults), 'c67a5248db596f9045239d1461ffae4901527a2ff8714428fd3eaed936c007b4');
}
exports.default = sha256_test;
//Run this Python3 program to verify the above test vectors
/*
import hashlib
import hmac

def hmacSha256(key, msg):
    return hmac.new(key, msg, hashlib.sha256).digest()

def sha256(data):
    m = hashlib.sha256()
    m.update(data)
    return m.digest()

def byteSequence(n):
    ba = bytearray(n)
    for i in range(0, n):
        ba[i] = i & 0xFF
    return ba

def reverseByteSequence(n):
    ba = bytearray(n)
    for i in range(0, n):
        ba[i] = 0xFF - (i & 0xFF)
    return ba

def main():
    print('sha256')
    
    print('sha256("a") == %s' % (sha256(b'a').hex()))

    print('sha256("abc") == %s' % (sha256(b'abc').hex()))
    
    data = reverseByteSequence(256)
    print('sha256(255 through 0) == %s' % (sha256(data).hex()))

    key = reverseByteSequence(256)
    print('hmacSha256(255-0, "Hello World") %s' % hmacSha256(key, b'Hello World').hex())


    print('hmacSha256 with many key and message sizes:')
    firstBytes = bytearray()
    all = bytearray()
    for inputSize in range(1, 66):
        key = reverseByteSequence(inputSize)
        msg = byteSequence(inputSize)

        res = hmacSha256(key, msg)
        if inputSize % 7 == 0:
            print('%02d: %s' % (inputSize, res.hex()))

        all += res
        firstBytes += res[0:1]

    print('First byte of each result %s' % firstBytes.hex())
    print('Hash of all results %s' % sha256(all).hex())
    

if __name__ == '__main__':
    main()

*/

},{"./assert":3,"./hex":11,"./sha256":15,"./utf8":18}],17:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert_test_1 = require("./assert_test");
var util_test_1 = require("./util_test");
var utf8_test_1 = require("./utf8_test");
var hex_test_1 = require("./hex_test");
var sha256_test_1 = require("./sha256_test");
var HmacCounterByteSource_test_1 = require("./HmacCounterByteSource_test");
var bcrypt_test_1 = require("./bcrypt_test");
var parallel_bcrypt_test_1 = require("./parallel_bcrypt_test");
var execute_parallel_bcrypt_webworkers_test_1 = require("./execute_parallel_bcrypt_webworkers_test");
var calcpass2017a_test_1 = require("./calcpass2017a_test");
function run_tests() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assert_test_1.default();
                    console.log('assert_test PASS');
                    util_test_1.default();
                    console.log('util_test PASS');
                    utf8_test_1.default();
                    console.log('utf8_test PASS');
                    hex_test_1.default();
                    console.log('hex_test PASS');
                    sha256_test_1.default();
                    console.log('sha256_test PASS');
                    HmacCounterByteSource_test_1.HmacCounterByteSource_test();
                    console.log('HmacCounterByteSource_test PASS');
                    bcrypt_test_1.default();
                    console.log('bcrypt_test PASS');
                    parallel_bcrypt_test_1.default();
                    console.log('parallel_bcrypt_test PASS');
                    return [4 /*yield*/, execute_parallel_bcrypt_webworkers_test_1.execute_parallel_bcrypt_webworkers_test()];
                case 1:
                    _a.sent();
                    console.log('execute_parallel_bcrypt_webworkers_test PASS');
                    console.log('Testing calcpass2017a...');
                    return [4 /*yield*/, calcpass2017a_test_1.calcpass2017a_test()];
                case 2:
                    _a.sent();
                    console.log('calcpass2017a PASS');
                    console.log('\nAll tests PASS');
                    return [2 /*return*/];
            }
        });
    });
}
window.addEventListener("load", function (e) { run_tests(); });

},{"./HmacCounterByteSource_test":2,"./assert_test":4,"./bcrypt_test":6,"./calcpass2017a_test":8,"./execute_parallel_bcrypt_webworkers_test":10,"./hex_test":12,"./parallel_bcrypt_test":14,"./sha256_test":16,"./utf8_test":19,"./util_test":21}],18:[function(require,module,exports){
/**Convert a unicode string to a Uint8Array of UTF-8 octets.*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function stringToUTF8(str) {
    if (typeof (str) != 'string')
        throw new Error('value is not a string!');
    //This method is recommended by
    //http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html
    var s2 = unescape(encodeURIComponent(str));
    var res = new Uint8Array(s2.length);
    for (var i = 0; i < s2.length; i++)
        res[i] = s2.charCodeAt(i);
    return res;
}
exports.stringToUTF8 = stringToUTF8;
/**This can be executed to ensure the browser supports the trick used by stringToUTF8()*/
function selfTest() {
    //2 Latin characters: æǼ
    var res = stringToUTF8("Z\u00e6\u01fcZ");
    var expect = [0x5a, 0xc3, 0xa6, 0xc7, 0xbc, 0x5a];
    if (res.length != 6)
        throw new Error('stringToUTF8 self-test failed. (' + res.length + ')');
    for (var i = 0; i < expect.length; i++) {
        if (res[i] !== expect[i]) {
            throw new Error('stringToUTF8 self-test failed. (index ' + i + ')');
        }
    }
}
exports.selfTest = selfTest;

},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utf8 = require("./utf8");
var assert = require("./assert");
function stringToUTF8_test() {
    //Simple ascii
    assert.equalArray(utf8.stringToUTF8('abcABC'), [0x61, 0x62, 0x63, 0x41, 0x42, 0x43]);
    //All printable ascii <= 127
    //2 Latin characters: æǼ
    assert.equalArray(utf8.stringToUTF8("\u00e6\u01fc"), [0xc3, 0xa6, 0xc7, 0xbc]);
    //2 characters: ℉℃
    assert.equalArray(utf8.stringToUTF8("\u2109\u2103"), [0xe2, 0x84, 0x89, 0xe2, 0x84, 0x83]);
    utf8.selfTest();
}
exports.default = stringToUTF8_test;

},{"./assert":3,"./utf8":18}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
/**Write zero into any array-like object.*/
function erase(array) {
    for (var i = 0; i < array.length; i++)
        array[i] = 0;
}
exports.erase = erase;
/**Build an incrementing sequence of bytes (handy for unit testing).*/
function byteSeq(start, count) {
    var res = new Uint8Array(count);
    for (var i = 0; i < count; i++) {
        res[i] = (start + i) & 0xFF;
    }
    return res;
}
exports.byteSeq = byteSeq;
/**Create a random integer from [0, n) where n is <= 256.
This function returns uniformly distributed numbers (no modulo bias).

Throws an error if the random source is exhausted or n exceeds 256.
*/
function UnbiasedSmallInt(source, n) {
    //Solutions from:
    //  https://zuttobenkyou.wordpress.com/2012/10/18/generating-random-numbers-without-modulo-bias/
    var randmax = 255;
    if (n <= 0 || n > (randmax + 1) || n !== Math.floor(n)) {
        throw new Error("UnbiasedSmallInt: n out of range: " + n);
    }
    var limit = randmax - ((randmax + 1) % n);
    var r;
    while (true) {
        r = source.NextByte();
        if (r <= limit)
            return r % n;
    }
}
exports.UnbiasedSmallInt = UnbiasedSmallInt;

},{}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("./util");
var assert = require("./assert");
//import * as hex from './hex'
var SourceOfOne = (function () {
    function SourceOfOne(b) {
        this.b = b;
        this.done = false;
    }
    SourceOfOne.prototype.NextByte = function () {
        if (this.done)
            throw new Error('SourceOfOne_DONE');
        this.done = true;
        return this.b;
    };
    return SourceOfOne;
}());
function spotcheck_UnbiasedSmallInt(inputByte, n) {
    var src = new SourceOfOne(inputByte);
    try {
        return util.UnbiasedSmallInt(src, n);
    }
    catch (e) {
        var errstr = '' + e;
        //error contains 'SourceOfOne_DONE' or 'n out of range' ?
        if (errstr.indexOf('SourceOfOne_DONE') >= 0 || errstr.indexOf('n out of range') >= 0)
            return -1;
        else
            throw e;
    }
}
function test_UnbiasedSmallInt() {
    //n too small
    assert.equal(-1, spotcheck_UnbiasedSmallInt(10, 0));
    //n too large
    assert.equal(-1, spotcheck_UnbiasedSmallInt(10, 257));
    //spot check with n == 26.  random bytes >= 234 will be discarded 
    assert.equal(10, spotcheck_UnbiasedSmallInt(10, 26));
    assert.equal(0, spotcheck_UnbiasedSmallInt(26, 26));
    assert.equal(22, spotcheck_UnbiasedSmallInt(100, 26));
    assert.equal(24, spotcheck_UnbiasedSmallInt(232, 26));
    assert.equal(25, spotcheck_UnbiasedSmallInt(233, 26));
    assert.equal(-1, spotcheck_UnbiasedSmallInt(234, 26));
    assert.equal(-1, spotcheck_UnbiasedSmallInt(235, 26));
    assert.equal(-1, spotcheck_UnbiasedSmallInt(255, 26));
    //spot check with n == 10.  random bytes >= 250 will be discarded 
    assert.equal(3, spotcheck_UnbiasedSmallInt(3, 10));
    assert.equal(0, spotcheck_UnbiasedSmallInt(10, 10));
    assert.equal(7, spotcheck_UnbiasedSmallInt(17, 10));
    assert.equal(8, spotcheck_UnbiasedSmallInt(248, 10));
    assert.equal(9, spotcheck_UnbiasedSmallInt(249, 10));
    assert.equal(-1, spotcheck_UnbiasedSmallInt(250, 10));
    assert.equal(-1, spotcheck_UnbiasedSmallInt(251, 10));
    assert.equal(-1, spotcheck_UnbiasedSmallInt(255, 10));
    //spot check with n == 256
    assert.equal(254, spotcheck_UnbiasedSmallInt(254, 256));
    assert.equal(255, spotcheck_UnbiasedSmallInt(255, 256));
}
function util_test() {
    var ar = [1, 2, 3];
    util.erase(ar);
    assert.equal(0, ar[1]);
    var bytes = new Uint8Array([1, 2, 3]);
    util.erase(bytes);
    assert.equal(0, bytes[2]);
    assert.equalArray(util.byteSeq(3, 5), [3, 4, 5, 6, 7]);
    test_UnbiasedSmallInt();
}
exports.default = util_test;

},{"./assert":3,"./util":20}]},{},[17]);
