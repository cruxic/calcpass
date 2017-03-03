(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
exports.config = {
    logToConsole: true
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
        var msg = "assert.equal FAILED: " + value2str(expect) + " !== " + value2str(value);
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

},{}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
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
exports["default"] = assert_test;

},{"./assert":1}],3:[function(require,module,exports){
/**Convert arrays of octets to and from hex strings*/
"use strict";
exports.__esModule = true;
function encode(octetArray) {
    var s = '';
    var tmp, b;
    for (var i = 0; i < octetArray.length; i++) {
        b = octetArray[i];
        if (typeof (b) !== 'number' || b < 0 || b > 255)
            throw new Error('Invalid octet at index ' + i);
        tmp = b.toString(16);
        if (tmp.length == 1)
            s += '0';
        s += tmp;
    }
    return s;
}
exports.encode = encode;
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

},{}],4:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var hex = require("./hex");
var assert = require("./assert");
function hex_test() {
    var ar = hex.decode('5A');
    assert.equalArray(ar, [0x5a]);
    assert.equal(hex.encode(ar), '5a');
    //empty is valid
    assert.equalArray(hex.decode(''), []);
    assert.equal(hex.encode([]), '');
    assert.throws(function () { return hex.decode('a'); });
    assert.throws(function () { return hex.decode('aaa'); });
    assert.throws(function () { return hex.decode('a?'); });
    assert.throws(function () { return hex.decode('5A '); });
    //0-255
    var allStr = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff";
    var all = [];
    for (var i = 0; i < 256; i++)
        all[i] = i;
    assert.equalArray(hex.decode(allStr), all);
    assert.equal(hex.encode(all), allStr);
}
exports["default"] = hex_test;

},{"./assert":1,"./hex":3}],5:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/*This Implements HMAC_DRBG in TypeScript, as per NIST Special Publication 800-90A.
It is a port of my Go implementation https://github.com/cruxic/go-hmac-drbg which
 was in turn ported from https://github.com/fpgaminer/python-hmac-drbg
*/
var sha256 = require("./sha256");
/**937 bytes (~7500 bits) as per the spec.*/
exports.MaxBytesPerGenerate = 937; // ~ 7500bits/8
/**Entropy for NewHmacDrbg() and Reseed() must never exceed this number of bytes.*/
exports.MaxEntropyBytes = 125; // = 1000bits
exports.MaxPersonalizationBytes = 32; // = 256bits
function _hmac(key, message) {
    return sha256.hmac(key, message);
}
//Because TypedArray.fill() is not supported by older browsers.
function fill(data, value) {
    for (var i = 0; i < data.length; i++)
        data[i] = value;
}
var HmacDrbg = (function () {
    /**Create a new DRBG.
    desiredSecurityLevelBits must be one of 112, 128, 192, 256.

    entropy length (in bits) must be at least 1.5 times securityLevelBits.
    entropy byte length cannot exceed MaxEntropyBytes.

    The personalization can be nil.  If non-nil, it's byte length cannot exceed MaxPersonalizationBytes.

    If any of the parameters are out-of-range this function will panic.
    */
    function HmacDrbg(securityLevelBits, entropy, personalization) {
        if (securityLevelBits != 112 &&
            securityLevelBits != 128 &&
            securityLevelBits != 192 &&
            securityLevelBits != 256) {
            throw new Error("Illegal desiredSecurityLevelBits");
        }
        if (entropy.length > exports.MaxEntropyBytes) {
            throw new Error("Input entropy too large");
        }
        if ((entropy.length * 8 * 2) < (securityLevelBits * 3)) {
            throw new Error("Insufficient entropy for security level");
        }
        if (personalization !== null && personalization.length > exports.MaxPersonalizationBytes) {
            throw new Error("Personalization too long");
        }
        this.SecurityLevelBits = securityLevelBits;
        this.k = new Uint8Array(32);
        this.v = new Uint8Array(32);
        this.reseedCounter = 1;
        //Instantiate
        //k already holds 0x00.
        //Fill v with 0x01.
        fill(this.v, 0x01);
        var nPers = (personalization !== null) ? personalization.length : 0;
        var seed = new Uint8Array(entropy.length + nPers);
        seed.set(entropy, 0); //copy from entropy to seed
        if (personalization !== null) {
            //append personalization
            seed.set(personalization, entropy.length);
        }
        this.update(seed);
    }
    HmacDrbg.prototype.update = function (providedData) {
        var nProvided = (providedData !== null) ? providedData.length : 0;
        var msg = new Uint8Array(this.v.length + 1 + nProvided);
        msg.set(this.v); //copy v to msg
        //leave hole with 0x00 at msg[len(this.v)]
        if (providedData != null) {
            msg.set(providedData, this.v.length + 1);
        }
        this.k = _hmac(this.k, msg);
        this.v = _hmac(this.k, this.v);
        if (providedData != null) {
            msg.set(this.v);
            msg[this.v.length] = 0x01;
            msg.set(providedData, this.v.length + 1);
            this.k = _hmac(this.k, msg);
            this.v = _hmac(this.k, this.v);
        }
    };
    HmacDrbg.prototype.Reseed = function (entropy) {
        if (entropy.length * 8 < this.SecurityLevelBits) {
            throw new Error("Reseed entropy is less than security-level");
        }
        if (entropy.length > exports.MaxEntropyBytes) {
            throw new Error("Reseed entropy exceeds MaxEntropyBytes");
        }
        this.update(entropy);
        this.reseedCounter = 1;
    };
    /**Fill the given byte array with random bytes.
    Returns false if a reseed is necessary first.
    This function will panic if the array is larger than MaxBytesPerGenerate.*/
    HmacDrbg.prototype.Generate = function (outputBytes) {
        var nWanted = outputBytes.length;
        if (nWanted > exports.MaxBytesPerGenerate) {
            throw new Error("HmacDrbg: generate request too large.");
        }
        if (this.reseedCounter >= 10000) {
            //set all bytes to zero, just to be clear
            fill(outputBytes, 0);
            return false;
        }
        var nGen = 0;
        var n;
        while (nGen < nWanted) {
            this.v = _hmac(this.k, this.v);
            n = nWanted - nGen;
            if (n >= this.v.length) {
                n = this.v.length;
                outputBytes.set(this.v, nGen);
                nGen += this.v.length;
            }
            else {
                for (var i = 0; i < n; i++)
                    outputBytes[nGen++] = this.v[i];
            }
        }
        this.update(null);
        this.reseedCounter++;
        return true;
    };
    return HmacDrbg;
}());
exports.HmacDrbg = HmacDrbg;
/**Read from an arbitrary number of bytes from HmacDrbg efficiently.
Internally it generates blocks of MaxBytesPerGenerate.  It then
serves these out through the standard `Read` function.  Read returns
an error if reseed becomes is necessary.
*/
/*
type HmacDrbgReader struct {
    Drbg *HmacDrbg
    buffer []byte //size MaxBytesPerGenerate
    offset int
}


func NewHmacDrbgReader(drbg *HmacDrbg) *HmacDrbgReader {
    return &HmacDrbgReader{
        Drbg: drbg,
        buffer: make([]byte, MaxBytesPerGenerate),
        offset: MaxBytesPerGenerate,
    }
}

func (self *HmacDrbgReader) Read(b []byte) (n int, err error) {
    nRead := 0
    nWanted := len(b)
    for nRead < nWanted {
        if this.offset >= MaxBytesPerGenerate {
            if !this.Drbg.Generate(this.buffer) {
                return nRead, errors.New("MUST_RESEED")
            }
            this.offset = 0
        }
        
        b[nRead] = this.buffer[this.offset]
        nRead++
        this.offset++
    }
    
    return nRead, nil
}
*/

},{"./sha256":7}],6:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var hmacdrbg_1 = require("./hmacdrbg");
var sha256 = require("./sha256");
var assert = require("./assert");
var hex = require("./hex");
//This test suite was ported from go-hmac-drbg
function hmacdrbg_test() {
    TestBasic();
    TestNIST1();
    TestAllGenerationLengths();
}
exports["default"] = hmacdrbg_test;
function TestBasic() {
    //These test vectors generated with https://github.com/fpgaminer/python-hmac-drbg
    var seed48 = hex.decode("b0a1f6d9707cc52b876d4a0ed0dd11718827f86f2c2405f7f9e068d9f5439e48531655d5b0d8170a389d9c176748f3f5");
    var e1 = hex.decode("550a8ad9e22d359c31e356efda");
    var e2 = hex.decode("16610f2eb23ccfde34fda35458cdeafc661ea67eb89c19223a28aab8353f322c7c");
    var e3 = hex.decode("e16bd5223256eab3f11ead68fa217e529307f5553ceecbfe96d8e2963d0d3f4b8588dec6d7d9410f1b4e3441c088e5a4d4441b8b74e23ad7f3c5312df3211601c79ee27a09dd0fc75f60d760b5c0ac0d72dd51161cb210703f0b5a307e62a14479d895c1ae73b8e3a694d8ec3d6655b949ea46b9ec07f3212de636ea717d6bb48ea5792534d1c42abaab79a761ef6b4f658d0b0c780f224a447ba63962c2943b721a44402fe1ffa667d3dbca7166aa356eba8d1fe1b5f5a5eed3c2d5139381b3ce12a3d11a3714e41639bf315810b3fd2ce5ab4086a1ea6827fb4c9d9680625f46858cf76d0622a4e9faf2507483208b632cd30817d459c4135d815f3c642188bee0eabd86f5c3faf622a5406873378eb6f59bd8fce24d3c17397af919f3f60d2b7f45fbccc205b477f38df6b0861bd155fbbdc11ea48dda7a1762b4133035b7a95b6becb17b4cdda86eed667c");
    var rng = new hmacdrbg_1.HmacDrbg(256, seed48, null);
    var got = new Uint8Array(e1.length);
    assert.isTrue(rng.Generate(got));
    assert.equalArray(got, e1);
    got = new Uint8Array(e2.length);
    assert.isTrue(rng.Generate(got));
    assert.equalArray(got, e2);
    got = new Uint8Array(e3.length);
    assert.isTrue(rng.Generate(got));
    assert.equalArray(got, e3);
    //With personalization string and reseed
    seed48 = hex.decode("c081232e6627b050e05a34cba6de97f6410a5e52739316443026cb2a40b5fe7648cea25464a79226bf97ef626a1a2579");
    var pers = hex.decode("d5ae166c587fd664e1a9e32b29");
    var reseed43 = hex.decode("a7428e1be103930fed246c5e934a4bf5685a340e16db08c0ffef857332f1d96464f12f8da7a5ddfcb76cb6");
    e1 = hex.decode("52292951368094b5a6c4af0346");
    e2 = hex.decode("1371416f080b0b0471678e80f4a5c23f614a1937c45f1eb7a60b7cc13a03af4579");
    rng = new hmacdrbg_1.HmacDrbg(256, seed48, pers);
    got = new Uint8Array(e1.length);
    assert.isTrue(rng.Generate(got));
    assert.equalArray(got, e1);
    rng.Reseed(reseed43);
    got = new Uint8Array(e2.length);
    assert.isTrue(rng.Generate(got));
    assert.equalArray(got, e2);
}
function TestNIST1() {
    //I think these are official test vectors from NIST.  I got them from:
    // https://github.com/fpgaminer/python-hmac-drbg/blob/master/HMAC_DRBG.rsp
    var EntropyInput = "fa0ee1fe39c7c390aa94159d0de97564342b591777f3e5f6a4ba2aea342ec840";
    var Nonce = "dd0820655cb2ffdb0da9e9310a67c9e5";
    var PersonalizationString = hex.decode("f2e58fe60a3afc59dad37595415ffd318ccf69d67780f6fa0797dc9aa43e144c");
    var EntropyInputReseed = hex.decode("e0629b6d7975ddfa96a399648740e60f1f9557dc58b3d7415f9ba9d4dbb501f6");
    var ReturnedBits = hex.decode("f92d4cf99a535b20222a52a68db04c5af6f5ffc7b66a473a37a256bd8d298f9b4aa4af7e8d181e02367903f93bdb744c6c2f3f3472626b40ce9bd6a70e7b8f93992a16a76fab6b5f162568e08ee6c3e804aefd952ddd3acb791c50f2ad69e9a04028a06a9c01d3a62aca2aaf6efe69ed97a016213a2dd642b4886764072d9cbe");
    var seed48 = hex.decode(EntropyInput + Nonce);
    var rng = new hmacdrbg_1.HmacDrbg(256, seed48, PersonalizationString);
    rng.Reseed(EntropyInputReseed);
    var got = new Uint8Array(ReturnedBits.length);
    assert.isTrue(rng.Generate(got));
    //yes, ignore the first batch of generated data
    assert.isTrue(rng.Generate(got));
    assert.equalArray(got, ReturnedBits);
}
function TestAllGenerationLengths() {
    //I created this test vector with https://github.com/fpgaminer/python-hmac-drbg
    var seed48 = new Uint8Array(48);
    for (var i = 0; i < seed48.length; i++) {
        seed48[i] = 97; //'a'
    }
    var rng = new hmacdrbg_1.HmacDrbg(256, seed48, null);
    var h = new sha256.Hash();
    //Test all valid Generate lengths
    for (var n = 1; n <= hmacdrbg_1.MaxBytesPerGenerate; n++) {
        var buf = new Uint8Array(n);
        assert.isTrue(rng.Generate(buf));
        h.update(buf);
    }
    var got = h.digest();
    var expect = hex.decode("ee5fb7498d044ad52dac5a4e6446da71a253d024985f4969dad8590e93890be3");
    assert.equalArray(got, expect);
}

},{"./assert":1,"./hex":3,"./hmacdrbg":5,"./sha256":7}],7:[function(require,module,exports){
"use strict";
exports.__esModule = true;
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
        for (var i = 0; i < this.buffer.length; i++)
            this.buffer[i] = 0;
        for (var i = 0; i < this.temp.length; i++)
            this.temp[i] = 0;
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
        this.istate = new Uint32Array(this.digestLength / 4);
        this.ostate = new Uint32Array(this.digestLength / 4);
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
exports["default"] = hash;
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

},{}],8:[function(require,module,exports){
"use strict";
exports.__esModule = true;
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
exports["default"] = sha256_test;
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

},{"./assert":1,"./hex":3,"./sha256":7,"./utf8":10}],9:[function(require,module,exports){
"use strict";
exports.__esModule = true;
//import sha256_test from './sha256_test'
var assert_test_1 = require("./assert_test");
var utf8_test_1 = require("./utf8_test");
var hex_test_1 = require("./hex_test");
var sha256_test_1 = require("./sha256_test");
var hmacdrbg_test_1 = require("./hmacdrbg_test");
function run_tests() {
    assert_test_1["default"]();
    console.log('assert_test PASS');
    utf8_test_1["default"]();
    console.log('utf8_test PASS');
    hex_test_1["default"]();
    console.log('hex_test PASS');
    sha256_test_1["default"]();
    console.log('sha256_test PASS');
    hmacdrbg_test_1["default"]();
    console.log('hmacdrbg_test PASS');
    console.log('\nAll tests PASS');
}
window.addEventListener("load", function (e) { run_tests(); });

},{"./assert_test":2,"./hex_test":4,"./hmacdrbg_test":6,"./sha256_test":8,"./utf8_test":11}],10:[function(require,module,exports){
/**Convert a unicode string to a Uint8Array of UTF-8 octets.*/
"use strict";
exports.__esModule = true;
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

},{}],11:[function(require,module,exports){
"use strict";
exports.__esModule = true;
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
exports["default"] = stringToUTF8_test;

},{"./assert":1,"./utf8":10}]},{},[9]);
