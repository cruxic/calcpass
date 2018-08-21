import {stringToUTF8} from './utf8';
import * as hex from './hex';
import * as sha256 from './sha256';
import * as util from './util';
import * as bytewords from './bytewords';

function genSecureRandomBytes(nBytes:number): Uint8Array {
	var ar = new Uint8Array(nBytes);
	window.crypto.getRandomValues(ar);
	return ar;
}

//Implements util.ByteSource
class SecureRandomByteSource {
	block: Uint8Array;
	blockOffset: number;

	constructor() {
		this.block = genSecureRandomBytes(32);
		this.blockOffset = 0;
	}

	NextByte():number {
		if (this.blockOffset >= this.block.length) {
			this.blockOffset = 0;
			this.block = genSecureRandomBytes(this.block.length);
		}

		return this.block[this.blockOffset++];
	}
}

function onLoad() {
	console.log('Onload!');

	//Self-test
	if (hex.encode(sha256.hmac(stringToUTF8('The-Key'), stringToUTF8('The-Message'))) != '9d77676b676ad963a2a581bdc8d78f1478ab2581014e40328cd9706bede5cec4') {
		alert('JavaScript self-test failed. Try a different web browser');
		throw new Error('JavaScript self-test failed');
	}

	var words = bytewords.getWords();

	//TODO: unit test this
	util.secureShuffle(words, new SecureRandomByteSource());

	//console.log(hex.encode(R));

	var elm = document.getElementById('cards');

	var html = '<div class="card0">';

	let i = 0;
	let j = 0;
	var w, tmp, rowClass;
	let row = 1;
	let cardN = 1;
	let N = 0;
	
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
			
		html += `<div class="row ${rowClass}"><div class="num">${tmp}</div>`;

		for (j = 0; j < 3; j++) {
			html += `<div class="cell">${w[j]}</div>`;			
		}

		html += '</div>';
		N++;

		if (N == 22) {
			html += '</div>';
			if ((cardN & 1) == 0)
				html += '<br/>';
			
			if (i < words.length)
				html += `<div class="card${cardN}">`;
			cardN++;
			N = 0;
		}
	}
	
	
	elm.innerHTML = html;
}


window.addEventListener("load", onLoad);
