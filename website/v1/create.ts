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

function makeCardRows(words: Array<string>): Array<string> {
	let rowNum = 1;
	let rows = new Array<string>();

	let footer = '<div class="row odd title">' +
		'Adam B. 2018 (Type 1)' +
		'</div>';
	rows.push(footer);
	

	let header = '<div class="row even header">' +
		'<div class="num">#</div>' +
		'<div class="cell">A</div>' +
		'<div class="cell">B</div>' +
		'<div class="cell">C</div>' +
		'</div>';
	rows.push(header);
	
	let i = 0;
	let j, tmp, rowClass, html;
	var w;
	while (i < words.length) {
		//Take 3 words
		w = ['', '', ''];
		for (j = 0; j < 3 && i < words.length; j++) {
			w[j] = words[i];
			i++;
		}

		//alternate row background color
		rowClass = (rowNum & 1) ? 'odd' : 'even';
		if (rowNum < 10)
			tmp = '0' + rowNum;
		else
			tmp = '' + rowNum;
		rowNum++;
			
		html = `<div class="row ${rowClass}"><div class="num">${tmp}</div>`;

		for (j = 0; j < 3; j++) {
			html += `<div class="cell">${w[j]}</div>`;			
		}

		html += '</div>';

		rows.push(html);
	}

	return rows;
}

function makeCards(rows: Array<string>, nPerCard: number): Array<string> {
	let cards = new Array<string>();

	let i = 0;
	let n, lines;
	while (i < rows.length) {
		n = rows.length - i;
		if (n > nPerCard)
			n = nPerCard;
			
		lines = rows.slice(i, i+n).join('\n');
		
		cards.push(lines);

		i += n;
	}

	return cards;
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

	let cards = makeCards(makeCardRows(words), 22);

	let elm;
	for (let i = 0; i < cards.length; i++) {
		elm = document.getElementById('card' + i);
		elm.innerHTML = cards[i];		
	}
}


window.addEventListener("load", onLoad);
