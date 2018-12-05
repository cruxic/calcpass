/**Functions supporting Calcpass "Type 1"*/

import {stringToUTF8} from './utf8';
import * as sha256 from './sha256';

export function normalizeField(s:string): string {
	if (typeof(s) != 'string')
		throw Error('illegal argument');

	//lower case with no leading or trailing space
	s = s.trim().toLowerCase();

	//no newlines or tabs
	s = s.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ');

	//Replace duplicate white-spaces with a single space.
	while (s.indexOf('  ') != -1)
		s = s.replace('  ', ' ');

	return s;	
}

/*
This function creates the "salt" used during the bcrypt hashing.
It is not real salt because it's not random. This creates the possibility
of rainbow table assisted guessing of the coordinate password.

However, rainbow tables will not be economical for the adversary because:

	1) Coordinates are not housed "enmass" on any server and thus are
	   only attacked one at a time.
	   
	2) Salt includes the website.  Even if adversary limits his table to the
	   top 10 websites, his table will take 10x longer to create and
	   occupy 10x more space.

	3) Salt includes the optional personalization text, which might include
		a revision number and/or user name.

	4) The hash is expensive!  4 invokations of bcrypt, cost 12.

*/
export function makeSiteId(site:string, personalization:string):Uint8Array {
	if (site.length == 0)
		throw Error('site too short');

	let input = stringToUTF8('calcpass-type1\n' + site + '\n' + personalization);

	return sha256.hash(input).slice(0, 16);
}

export function createWordCoordinates(hash:Uint8Array, nWords:number): Array<string> {
	if (hash.length != 32)
		throw Error('wrong hash length');
	if (nWords < 1 || nWords > hash.length)
		throw Error('nWords out of range');

	let coords = new Array<string>(nWords);

	for (let i = 0; i < nWords; i++) {
		let wordIndex = hash[i];  //0-255
		//Note: no modulo bias since wordIndex is exactly 8 bits.

		let res = getColumnIndexAndWordNumber(wordIndex);		
		coords[i] = ColumnLetters.charAt(res[0]) + res[1];
	}

	return coords;
}

/*
Given a word index (0-255) get the column it belongs in (0-11) and
the word number within that column.  Note: word numbers are unique
within the entire quadrant (3 columns).
*/
function getColumnIndexAndWordNumber(wordIndex:number): Array<number> {
	if (wordIndex < 0 || wordIndex > 255)
		throw Error('wordIndex out of range');

	let k = 0;
	let numInQuad = 1;
	for (let col = 0; col < 12; col++) {
		//reset numInQuad when starting new quadrant
		if (col % 3 == 0)
			numInQuad = 1;

		let colSize = getColSize(col);
		k += colSize;
		if (wordIndex < k) {
			return [col, numInQuad + (k - wordIndex)];
		}

		numInQuad += colSize;
	}

	throw Error('assertion failed');
}

//The twelve column header letters as a string.
export const ColumnLetters = 'ABCDEFTUVXYZ';

function getColSize(columnIndex:number) {
	//First three columns and very last colum have 20.
	//All others are 22.
	if (columnIndex < 3 || columnIndex == 11)
		return 20;
	else
		return 22;
}

/*
Encapsulates how the 256 words are arranged on the screen or printed paper.
*/
export class WordLayout {
	columns: Array<Array<WordCell>>;

	constructor() {		
		this.columns = [
			//top-left
			new Array<WordCell>(getColSize(0)),  //A
			new Array<WordCell>(getColSize(1)),  //B
			new Array<WordCell>(getColSize(2)),  //C
			//top-right
			new Array<WordCell>(getColSize(3)),  //D
			new Array<WordCell>(getColSize(4)),  //E
			new Array<WordCell>(getColSize(5)),  //F
			//bottom-left
			new Array<WordCell>(getColSize(6)),  //T
			new Array<WordCell>(getColSize(7)),  //U
			new Array<WordCell>(getColSize(8)),  //V		
			//bottom-right
			new Array<WordCell>(getColSize(9)),  //X
			new Array<WordCell>(getColSize(10)), //Y
			new Array<WordCell>(getColSize(11)), //Z
		];

		//create WordCell objects
		let numInQuad = 1;
		for (let c = 0; c < this.columns.length; c++) {
			//reset numInQuad when starting new quadrant
			if (c % 3 == 0)
				numInQuad = 1;
			for (let r = 0; r < this.columns[c].length; r++) {
				this.columns[c][r] = new WordCell(numInQuad++);
			}
		}	
	}

	assignWords(words: Array<string>) {
		if (words.length != 256)
			throw new Error('expected 256 words');

		let w = 0;
		for (let c = 0; c < this.columns.length; c++) {
			for (let r = 0; r < this.columns[c].length; r++) {
				this.columns[c][r].word = words[w++];
			}
		}
	}

	//For testing
	assignTestWords() {
		let words = new Array(256);
		for (let i = 0; i < words.length; i++)
			words[i] = 'w' + (i + 1);

		this.assignWords(words);
	}


	/*
	For a given quadrant (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
	return an array of rows where every row has 3 cells.
	*/
	getQuadrantRows(quad:number): Array<Array<WordCell>> {
		let columns = this.columns;
		let c = quad * 3;
		let rows = new Array<Array<WordCell>>(columns[c].length);
		let i = 0;
		
		for (let r = 0; r < columns[c].length; r++) {
			let row = new Array<WordCell>(3);
			
			row[0] = columns[c][r];
			row[1] = columns[c+1][r];
			
			//very last column has fewer rows
			if (r < columns[c+2].length)
				row[2] = columns[c+2][r];
			else
				row[2] = new WordCell(0);
				
			rows[i++] = row;
		}
		
		return rows;
	}
}

export class WordCell {
	//The word.  Empty if not assigned.
	word: string;
	
	//Word number within the quad.
	numInQuad: number;

	constructor(numInQuad:number) {
		this.word = '';
		this.numInQuad = numInQuad;
	}
}
