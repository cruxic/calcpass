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
//import sha256_test from './sha256_test'
var assert_test_1 = require("./assert_test");
var utf8_test_1 = require("./utf8_test");
var hex_test_1 = require("./hex_test");
function run_tests() {
    assert_test_1["default"]();
    console.log('assert_test PASS');
    utf8_test_1["default"]();
    console.log('utf8_test PASS');
    hex_test_1["default"]();
    console.log('hex_test PASS');
    console.log('\nAll tests PASS');
}
window.addEventListener("load", function (e) { run_tests(); });

},{"./assert_test":2,"./hex_test":4,"./utf8_test":7}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"./assert":1,"./utf8":6}]},{},[5]);
