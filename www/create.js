"use strict";

function getTrulyRandomWords(numWords) {
	
	var array = new Uint32Array(numWords);
	window.crypto.getRandomValues(array);
	
	var bytes = new sha256.Bytes.fromWordArray(array);
	
	if (bytes.words.length != numWords)
		throw new Error("Assertion failed");	
		
	//sanity: data is not constant!
	var i;
	var ok = false;
	for (i = 1; i < bytes.words.length; i++) {
		if (bytes.words[i-1] != bytes.words[i]) {
			ok = true;
			break;
		}
	}
	if (!ok)
		throw new Error("Non-random data!");
		
	//erase original
	for (i = 0; i < array.length; i++)
		array[i] = 0;		
	
	return bytes;
}

//Random data from window.crypto.getRandomValues().
function BrowserRandByteSource() {
	this.chunk = new Uint8Array(32);
	this.i = 32;
}

BrowserRandByteSource.prototype._refill = function() {
	//zero out chunk so that we can prove it was filled again
	var j;
	for (j = 0; j < this.chunk.length; j++)
		this.chunk[i] = 0;

	window.crypto.getRandomValues(this.chunk);	
	
	//sanity: data is not constant!
	var i;
	var ok = false;
	for (i = 1; i < this.chunk.length; i++) {
		if (this.chunk[i-1] != this.chunk[i]) {
			ok = true;
			break;
		}
	}
	if (!ok)
		throw new Error("Non-random data!");	
		
	this.i = 0;
};

BrowserRandByteSource.prototype.nextByte = function() {
	//Need more bytes?
	if (this.i >= this.chunk.length)
		this._refill();
		
	return this.chunk[this.i++];
};

function ConstByteSource(hexStr) {
	this.bytes = [];
	this.idx = 0;
	var i, s;
	for (i = 0; i + 1 < hexStr.length; i += 2) {
		s = hexStr.substring(i, i+2);
		this.bytes.push(parseInt(s, 16));
	}
}

ConstByteSource.prototype.nextByte = function() {
	if (this.idx >= this.bytes.length)
		this.idx = 0;
	return this.bytes[this.idx++];
};

//Read 5 bits at a time from any object having a nextByte() function.
function FiveBitReader(byteSource) {
	this.byteSource = byteSource;
	this.bits = 0;
	this.nBitsAvailable = 0;
}

FiveBitReader.prototype.next5Bits = function() {

	//ensure we have at least 5 bits
	if (this.nBitsAvailable < 5) {
		var byte = this.byteSource.nextByte();
		this.bits |=  byte << (4 - this.nBitsAvailable);
		this.nBitsAvailable += 8;		
	}
	
	//Take the high 5 bits
	var result = this.bits >> 7;
	
	//shift remaining bits left
	this.bits = (this.bits << 5) & 0xFFF;	
	this.nBitsAvailable -= 5;
	
	return result;
};

//Return a random number between 0 and 25 (inclusive).
//To avoid modulo bias sometimes multiple calls to next5Bits() are necessary.
function rand26(fiveBitReader) {
	//We must TAKE CARE to avoid modulo bias!
	//https://zuttobenkyou.wordpress.com/2012/10/18/generating-random-numbers-without-modulo-bias/
	
	var i, x;
	for (i = 0; i < 1000; i++) {
		x = fiveBitReader.next5Bits();
		if (x <= 25)
			return x;
	}
	
	throw new Error("Unsuitable random source!");
}


//Convert an integer to an string of 0/1, padding with leading zeros.
function byte2base2(b, padlen) {
	padlen = padlen || 8;
	var s = b.toString(2);
	while (s.length < padlen) {
		s = '0' + s;
	}
	return s;
}

function selftest() {
	//
	// Test secureShuffle
	//
	
	//rng that returns descending integers
	var rng = {
		i: 1000,
		rand_u16: function() {
			return this.i--;		
		}
	};
	
	//Above rng will reverse the list
	var list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	secureShuffle(list, rng);
	assertEq(list.join(''), 'ZYXWVUTSRQPONMLKJIHGFEDCBA');
	
	//rng that returns fixed sequence
	rng = {
		seq: [3,1,4,5,2],
		i: 0,
		rand_u16: function() {
			var n = this.seq[this.i % this.seq.length];
			this.i++;
			return n;
		}
	};
	var list = 'ABCDE'.split('');
	secureShuffle(list, rng);
	assertEq(list.join(''), 'BEACD');
	
	//
	// arrayToGrid
	var ar = [0,1,2,3,4,5,6,7,8,9];
	var grid = arrayToGrid(ar, 3, 2);
	assertEq(grid.length, 2);
	assertEq(grid[0].join(','), '0,1,2');
	assertEq(grid[1].join(','), '3,4,5');
	
	//
	// formatSeed
	var fmt = formatSeed('abcdefghijklmnopqrstuvwxyz123456').split('\n');
	assertEq(fmt[0], 'abcd-efgh-ijkl-mnop');
	assertEq(fmt[1], 'qrst-uvwx-yz12-3456');
	
	
		

	shared_selftest();
	sha256.selftest();
	
	/*
	//Test ConstByteSource
	var cbs = new ConstByteSource('1234');
	assert(cbs.nextByte() == 0x12);
	assert(cbs.nextByte() == 0x34);
	assert(cbs.nextByte() == 0x12);
	
	//Test byte2base2
	assert(byte2base2(0) == '00000000');
	assert(byte2base2(1) == '00000001');
	assert(byte2base2(0xA5) == '10100101');
	
	//Test FiveBitReader
	var fbr = new FiveBitReader(new ConstByteSource('5A'));
	var i;
	var list = [];
	for (i = 0; i < 9; i++)
		list.push(byte2base2(fbr.next5Bits(), 5));
	var s = list.join(' ');
	assert(s == '01011 01001 01101 00101 10100 10110 10010 11010 01011');
	
	//the following test vector was generated with a simple python program
	fbr = new FiveBitReader(new ConstByteSource('09e3291f04af2a5c2ecbc4537bd563'));
	list = [];
	for (i = 0; i < 24; i++)
		list.push(byte2base2(fbr.next5Bits(), 5));
	s = list.join(',');
	var expect = '00001,00111,10001,10010,10010,00111,11000,00100,10101,11100,10101,00101,11000,01011,10110,01011,11000,10001,01001,10111,10111,10101,01011,00011';
	assert(s == expect);
	
	//
	//Test rand26
	//
	
	//A 5bit reader that returns a fixed number sequence
	fbr = {
		seq: [0,1,2,25,26,27,28,29,30,31,7],
		idx: 0,
		next5Bits: function() {
			return this.seq[this.idx++];
		}
	};
	
	assertEq(rand26(fbr), 0);
	assertEq(rand26(fbr), 1);
	assertEq(rand26(fbr), 2);
	assertEq(rand26(fbr), 25);
	//skipped 26-31 due to modulo bias
	assertEq(rand26(fbr), 7);
	*/
	
	console.log('selftest PASSED');
}

function grid2HTML(grid, topIndexChars, sideIndexChars) {
	
	var lines = [];
	
	//top header
	var x, y;
	var line = ['<span class="topLeft">&nbsp;&nbsp;</span>'];
	for (x = 0; x < CARD_CHAR_W; x++) {
		line.push('<span class="topHdr">' + topIndexChars[x] + '</span>');
	}
	//lines.push(line.join(''));
	lines.push(line.join(''));
	
	//rows
	var tmp, c;
	for (y = 0; y < CARD_CHAR_H; y++) {
		c = sideIndexChars[y];
		if (c.length == 1)
			c = '&nbsp;' + c;
		tmp = '<span class="sideHdr">' + c + '</span>';
		line = [tmp];
		for (x = 0; x < grid[y].length; x++)
			line.push('<span id="c'+ x + '_' + y +'" class="cell">' + grid[y][x] + '</span>');
		//line = [tmp].concat(grid[y]);
		lines.push(line.join(''));
	}
	
	return lines.join('<br/>');
}

function logCounts(counts) {
	var lines = [];
	var alb = ALPHABET_26_LOWER;
	var i, s;
	var line = ''
	for (i = 0; i < counts.length; i++) {
		line += alb[i] + '  ';
	}
	console.log(line);
	
	var idealCount = CARD_CHAR_W * CARD_CHAR_H / alb.length;
	line = ''
	for (i = 0; i < counts.length; i++) {
		s = '' + counts[i];
		if (counts[i] < 10)
			line += counts[i] + '  ';
		else
			line += counts[i] + ' ';
	}
	console.log(line);
}

var gScribbler = null;

function Scribbler(canvasId, doneCallback, requiredNumSamples) {
	this.canvElm = document.getElementById(canvasId);	
	this.ctx = this.canvElm.getContext("2d");
	this.lastX = -1;
	this.lastY = -1;
	this.hue = 1.0;	
	this.ctx.lineWidth = 4;
	this.noise = [];
	this.doneCallback = doneCallback;
	this.done = false;
	this.requiredNumSamples = requiredNumSamples;
	this.canvElm.addEventListener("mousemove", this.on_mousemove.bind(this));
	this.canvElm.addEventListener("touchmove", this.on_mousemove.bind(this));  //for mobile devices
}

Scribbler.prototype.on_mousemove = function(e) {
	if (this.done || !e.clientX)
		return;

	//console.log(e.clientX + "," + e.clientY);
	var rect = this.canvElm.getBoundingClientRect();
	var x = e.clientX - rect.left;
	var y = e.clientY - rect.top;
	
	if (this.lastX == -1) {
		this.lastX = x - 1;
		this.lastY = y - 1;
	}
	
	var ctx = this.ctx;

	this.hue += 0.05;
	if (this.hue > 1.0)
		this.hue = 0.0;
	this.ctx.strokeStyle = HSVtoRGB(this.hue, 1.0, 1.0);
		
	ctx.beginPath();
	ctx.moveTo(this.lastX, this.lastY);
	ctx.lineTo(x, y);
	ctx.stroke();
	ctx.closePath();
	
	this.lastX = x;
	this.lastY = y;
	
	//use milliseconds and position as random data
	this.noise.push(performance.now() & 0xFFFFFFFF);  //force primitive integer
	this.noise.push(x);
	this.noise.push(y);
	
	//update progress bar
	var elm = document.getElementById('progress');
	var nSamples = this.noise.length / 3;
	var percent = Math.floor(nSamples / this.requiredNumSamples * 100.0);
	elm.firstChild.nodeValue = percent + '%';
	
	//done?
	if (percent >= 100) {
		this.done = true;
		elm.firstChild.nodeValue = '100% - Thank you.';
		
		//wait a second then submit
		var result = this.noise;
		var callback = this.doneCallback;
		setTimeout(function() {
			callback(result);
		}, 1000);
		
	}
};


//http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    
	r = Math.round(r * 255.0);
    g = Math.round(g * 255.0);
    b = Math.round(b * 255.0);
    return "#" + ((r << 16) | (g << 8) | b).toString(16);    
}

function digestScribbleNoise(integers) {
	//sanity
	if (integers.length < 100) {
		throw new Error('Scribble noise too short');			
	}
	
	//sanity
	var i;
	for (i = 0; i < integers.length; i++) {
		if (typeof(integers[i]) != 'number')
			throw new Error('Scribble noise at index ' + i + ' is not a number!');	
	}
	
	//feed each integer to sha256 as a 32bit integer
	var input = sha256.Bytes.fromWordArray(integers);
	var hash = sha256.sha256(input);
	input.erase();
	return hash;
}

function onScribbleDone(integers) {
	var noise1 = digestScribbleNoise(integers);
	
	//erase integers
	var i;
	for (i = 0; i < integers.length; i++)
		integers[i] = 0;
	
	beginStep2(noise1);
}

function createAZSeed(noise1, noise2) {
	//Mix noise from user and noise from OS
	
	var mixed = sha256.hmac(noise2, noise1);
	
	//Use mixed noise to generate 30 characters, A-Z.  This is roughly
	// 128bits of entropy
	var rng = new UnbiasedRNG(new AES128_DRBG(mixed));
	mixed.erase();
	var seed = '';
	var i;
	for (i = 0; i < 30; i++)
		seed += rng.rand_A_Z();

	//Append 2 character checksum
	var chk = sha256.digestString(seed);
	var b0 = chk.getByte(0);
	var b1 = chk.getByte(1);
	seed += String.fromCharCode(0x41 + (b0 % 26));  //0x41 is 'A'
	seed += String.fromCharCode(0x41 + (b1 % 26));
	
	chk.erase();	
	
	return seed;
}

//Convert a 1D array to a 2D array (array[h][w])
function arrayToGrid(ar, w, h) {
	var grid = new Array(h);
	var y;
	for (y = 0; y < h; y++) {
		grid[y] = ar.slice(y * w, y * w + w);
	}
	
	return grid;
}

function gridToStr(grid) {
	var lines = new Array(grid.length);
	var i, j;
	for (i = 0; i < grid.length; i++) {
		lines[i] = grid[i].join('');
	}
		
	return lines.join('\n');
}

function formatSeed(seed) {
	assertEq(seed.length, 32);
	
	//2 lines of 4 groups of 4 characters separated by dashes.
	var s = '';
	var i, j;
	i = 0;
	while (i < seed.length) {
		if (i == seed.length / 2)
			s += '\n';
		else if (i > 0)
			s += '-';		
				
		s += seed.substring(i, i + 4);
		i += 4;
	}
	
	return s;
}

function beginStep2(noise1) {
	toggleBlock('step1', false);
	
	var noise2 = getTrulyRandomWords(8);
	
	var seed = createAZSeed(noise1, noise2);
	noise1.erase();
	noise2.erase();
	
	var nPerCard = CARD_CHAR_W * CARD_CHAR_H;
	var chars = randCharsFromSeed(seed, nPerCard * 2);
	assertEq(chars.length, nPerCard * 2);
	
	var grid1 = arrayToGrid(chars, CARD_CHAR_W, CARD_CHAR_H);
	var grid2 = arrayToGrid(chars.slice(nPerCard), CARD_CHAR_W, CARD_CHAR_H);
	
	//charStats(chars);
	
	//console.log(gridToStr(grid1));
	//console.log('');
	//console.log(gridToStr(grid2));
	
	
	var html1 = grid2HTML(grid1, CARD_TOP_INDEX_CHARS, CARD_SIDE_INDEX_CHARS.slice(0, CARD_CHAR_H));
	var html2 = grid2HTML(grid2, CARD_TOP_INDEX_CHARS, CARD_SIDE_INDEX_CHARS.slice(CARD_CHAR_H));
	
	document.getElementById('card1').innerHTML = html1;	
	document.getElementById('card2').innerHTML = html2;	
	
	var seedParts = formatSeed(seed).split('\n');
	console.log(formatSeed(seed));
	
	setElmText('seedPart1', seedParts[0]);
	setElmText('seedPart2', seedParts[1]);
	
	toggleBlock('step2', true);
}

function charStats(chars) {
	var letter, index;
	var alb = ALPHABET_26_LOWER;
	var counts = new Array(alb.length);
	
	var i;
	for (i = 0; i < counts.length; i++)
		counts[i] = 0;
		
	for (i = 0; i < chars.length; i++) {
		letter = chars[i];
		index = alb.indexOf(letter);
		if (index == -1)
			throw new Error("letter not in alphabet");			
		counts[index]++;
	}
	
	logCounts(counts);
}


//Randomly reorder the given array without bias
function secureShuffle(list, rng) {
	var count = list.length;
	
	//Don't attempt huge lists because we are using 16bit random integers
	if (count > 0x7fff)
		throw new Error('list too large');
		
	//Create one random integer for every element. I avoid duplicates to
	// ensure a stable sort
	var ints = new Array(count);
	var i, j, k;
	for (i = 0; i < count; i++) {
		//the following rarely loops more than once
		j = 0;
		while (true) {
			//Rand 16bit integer.
			k = rng.rand_u16();
			
			//Unique?
			if (ints.indexOf(k) == -1) {
				ints[i] = k;
				break;
			}
			
			j++;
			if (j > 1000 && j > count)
				throw new Error("Unable to produce unique integer");
		}
	}		

	//Attach random ints to each element
	for (i = 0; i < count; i++) {
		list[i] = [list[i], ints[i]];
		ints[i] = 0;  //erase
	}
		
	//Sort
	list.sort(function(a, b) {
		return a[1] - b[1];	
	});
	
	//Detach random ints and erase
	for (i = 0; i < count; i++) {
		j = list[i];
		list[i] = j[0];
		j[0] = 0;
		j[1] = 0;
	}
}

function randCharsFromSeed(seed, count) {
		
	//Prepare a CSPRNG from the ASCII seed.
	//Initialize with HMAC in case of any sha256 weakness
	if (seed.length != 32)
		throw new Error("Wrong seed length");
	var input = sha256.Bytes.fromStringUTF8(seed);
	var initHash = sha256.hmac(input, input);
	input.erase();
	
	var rng = new UnbiasedRNG(new AES128_DRBG(initHash));
	initHash.erase();
		
		
	//I wish to have a roughly equal distribution of the letters A-Z.
	//For example, 'a' should occur roughly the same number of times as 'b'.
	// So instead of pulling letters out of a bag at random I'll start with
	// an equal distribution and then shuffle them randomly.
	
	var alphabet = ALPHABET_26_LOWER.split("");  //split converts string to array of chars
	
	//Repeat the alphabet nWhole times.  Avoid appending
	// a truncated alphabet to avoid bias
	var chars = [];
	var nWhole = Math.floor(count / alphabet.length);
	var i;
	for (i = 0; i < nWhole; i++)
		chars = chars.concat(alphabet);
	
	//For the remainder, shuffle the alphabet and take a slice of it
	secureShuffle(alphabet, rng);
	chars = chars.concat(alphabet.slice(0, count - chars.length));
	
	//Now we are ready to shuffle everything
	secureShuffle(chars, rng);
	
	console.log("Num bytes used " + rng.nBytesUsed);
		
	return chars;
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

function onLoad() {
	selftest();
	
	gScribbler = new Scribbler('scribbleCanv', onScribbleDone, 50);
	
	/*

	
	//var randSrc = new BrowserRandByteSource();
	
	//var grid = randAZGrid(CARD_CHAR_W, CARD_CHAR_H, randSrc);
	var grid = generateWellDispersedGrid();
	
	//var card1 = randCard1(grid).join('<br/>');	
	var html = grid2HTML(grid);	
	
	//document.getElementById('card1').innerHTML = card1;	
	document.getElementById('card1').innerHTML = html;
	
	
*/
/*
	var card3 = randCard3(grid);	
	document.getElementById('card3').innerHTML = card3;
	
	var card4 = randCard4(grid);	
	document.getElementById('card4').innerHTML = card4;
*/	
}
