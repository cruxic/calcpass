(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getWords() {
    //return copy
    return BYTEWORDS.slice();
}
exports.getWords = getWords;
var BYTEWORDS = [
    "ace",
    "act",
    "add",
    "age",
    "aid",
    "aim",
    "air",
    "ale",
    "all",
    "and",
    "ant",
    "any",
    "ape",
    "arm",
    "art",
    "ash",
    "ask",
    "ate",
    "axe",
    "bad",
    "bag",
    "ban",
    "bar",
    "bat",
    "bay",
    "bed",
    "beg",
    "bet",
    "big",
    "bop",
    "box",
    "boy",
    "bug",
    "bun",
    "bus",
    "bit",
    "bye",
    "cab",
    "can",
    "cap",
    "car",
    "cat",
    "cog",
    "cow",
    "cry",
    "cup",
    "cut",
    "dad",
    "day",
    "den",
    "did",
    "dig",
    "dim",
    "dip",
    "dog",
    "dot",
    "dry",
    "dug",
    "ear",
    "eat",
    "egg",
    "elf",
    "end",
    "fab",
    "fan",
    "far",
    "fat",
    "fax",
    "fee",
    "few",
    "fig",
    "fit",
    "fix",
    "fly",
    "fog",
    "fox",
    "fun",
    "fur",
    "gag",
    "gap",
    "gas",
    "got",
    "gum",
    "gut",
    "guy",
    "had",
    "ham",
    "has",
    "hat",
    "hen",
    "her",
    "hex",
    "hid",
    "him",
    "hip",
    "his",
    "hit",
    "hog",
    "how",
    "hub",
    "hug",
    "hum",
    "hut",
    "ice",
    "ink",
    "jag",
    "jam",
    "jar",
    "job",
    "jog",
    "joy",
    "jug",
    "key",
    "kid",
    "kit",
    "lab",
    "lap",
    "law",
    "lay",
    "leg",
    "let",
    "lid",
    "lie",
    "lip",
    "log",
    "low",
    "lug",
    "mad",
    "mag",
    "man",
    "map",
    "max",
    "men",
    "met",
    "mid",
    "min",
    "mix",
    "mom",
    "mow",
    "mud",
    "mug",
    "nag",
    "nap",
    "nay",
    "net",
    "new",
    "now",
    "nut",
    "oak",
    "oar",
    "oat",
    "odd",
    "off",
    "oil",
    "old",
    "out",
    "owl",
    "own",
    "pad",
    "pal",
    "pan",
    "paw",
    "pay",
    "peg",
    "pen",
    "pet",
    "pig",
    "pin",
    "pit",
    "pop",
    "pot",
    "pub",
    "put",
    "rad",
    "rag",
    "ram",
    "ran",
    "rap",
    "rat",
    "raw",
    "ray",
    "red",
    "rex",
    "rib",
    "rid",
    "rim",
    "rip",
    "row",
    "rub",
    "rug",
    "rum",
    "run",
    "rut",
    "sad",
    "sat",
    "saw",
    "say",
    "set",
    "she",
    "shy",
    "sip",
    "sir",
    "sit",
    "ski",
    "sky",
    "sly",
    "sow",
    "soy",
    "spa",
    "spy",
    "sum",
    "sun",
    "tab",
    "tag",
    "tan",
    "tap",
    "tar",
    "tax",
    "tex",
    "the",
    "til",
    "tin",
    "tip",
    "top",
    "toy",
    "try",
    "tub",
    "tug",
    "use",
    "van",
    "vet",
    "vex",
    "vow",
    "wad",
    "wag",
    "war",
    "was",
    "wax",
    "way",
    "web",
    "wet",
    "who",
    "why",
    "wig",
    "win",
    "won",
    "wow",
    "yak",
    "yam",
    "yes",
    "yet",
    "yum",
    "zap",
    "zen",
    "zip",
    "zoo",
];

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utf8_1 = require("./utf8");
var hex = require("./hex");
var sha256 = require("./sha256");
var util = require("./util");
var bytewords = require("./bytewords");
function genSecureRandomBytes(nBytes) {
    var ar = new Uint8Array(nBytes);
    window.crypto.getRandomValues(ar);
    return ar;
}
//Implements util.ByteSource
var SecureRandomByteSource = /** @class */ (function () {
    function SecureRandomByteSource() {
        this.block = genSecureRandomBytes(32);
        this.blockOffset = 0;
    }
    SecureRandomByteSource.prototype.NextByte = function () {
        if (this.blockOffset >= this.block.length) {
            this.blockOffset = 0;
            this.block = genSecureRandomBytes(this.block.length);
        }
        return this.block[this.blockOffset++];
    };
    return SecureRandomByteSource;
}());
function onLoad() {
    console.log('Onload!');
    //Self-test
    if (hex.encode(sha256.hmac(utf8_1.stringToUTF8('The-Key'), utf8_1.stringToUTF8('The-Message'))) != '9d77676b676ad963a2a581bdc8d78f1478ab2581014e40328cd9706bede5cec4') {
        alert('JavaScript self-test failed. Try a different web browser');
        throw new Error('JavaScript self-test failed');
    }
    var words = bytewords.getWords();
    //TODO: unit test this
    util.secureShuffle(words, new SecureRandomByteSource());
    //console.log(hex.encode(R));
    var elm = document.getElementById('cards');
    var html = '<div class="card0">';
    var i = 0;
    var j = 0;
    var w, tmp, rowClass;
    var row = 1;
    var cardN = 1;
    var N = 0;
    while (i < words.length) {
        w = ['', '', ''];
        for (j = 0; j < 3 && i < words.length; j++) {
            w[j] = words[i];
            i++;
        }
        rowClass = (row & 1) ? 'odd' : 'even';
        if (row < 10)
            tmp = '0' + row;
        else
            tmp = '' + row;
        row++;
        html += "<div class=\"row " + rowClass + "\"><div class=\"num\">" + tmp + "</div>";
        for (j = 0; j < 3; j++) {
            html += "<div class=\"cell\">" + w[j] + "</div>";
        }
        html += '</div>';
        N++;
        if (N == 22) {
            html += '</div>';
            if ((cardN & 1) == 0)
                html += '<br/>';
            if (i < words.length)
                html += "<div class=\"card" + cardN + "\">";
            cardN++;
            N = 0;
        }
    }
    elm.innerHTML = html;
}
window.addEventListener("load", onLoad);

},{"./bytewords":1,"./hex":3,"./sha256":4,"./utf8":5,"./util":6}],3:[function(require,module,exports){
"use strict";
/**Convert arrays of octets to and from hex strings*/
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

},{}],4:[function(require,module,exports){
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
var Hash = /** @class */ (function () {
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
var HMAC = /** @class */ (function () {
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

},{}],5:[function(require,module,exports){
"use strict";
/**Convert a unicode string to a Uint8Array of UTF-8 octets.*/
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

},{}],6:[function(require,module,exports){
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
/**
Sort the given array randomly, without modulo bias.
*/
function secureShuffle(array, randSource) {
    if (array.length > 0x8000)
        throw new Error('array too large');
    var used = {};
    var tuples = new Array(array.length);
    var i, r, k;
    for (i = 0; i < array.length; i++) {
        //Make a random 16bit integer.
        //The integer must be unique to ensure stable sorting.
        while (true) {
            r = (randSource.NextByte() << 8) | randSource.NextByte();
            //Skip 
            k = 'R' + r;
            if (!used[k]) {
                used[k] = true;
                break;
            }
        }
        tuples[i] = [array[i], r];
    }
    //sort by the random integer
    tuples.sort(function (a, b) {
        return a[1] - b[1];
    });
    for (i = 0; i < array.length; i++)
        array[i] = tuples[i][0];
    return array;
}
exports.secureShuffle = secureShuffle;

},{}]},{},[2]);
