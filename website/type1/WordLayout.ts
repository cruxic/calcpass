


/*
Encapsulates how the 256 words are arranged on the screen or printed paper.
*/
export class WordLayout {
	columns: Array<Array<WordCell>>;

	constructor() {		
		this.columns = [
			//top-left
			new Array<WordCell>(20),  //A
			new Array<WordCell>(20),  //B
			new Array<WordCell>(20),  //C
			//top-right
			new Array<WordCell>(22),  //D
			new Array<WordCell>(22),  //E
			new Array<WordCell>(22),  //F
			//bottom-left
			new Array<WordCell>(22),  //G
			new Array<WordCell>(22),  //H
			new Array<WordCell>(22),  //I		
			//bottom-right
			new Array<WordCell>(22),  //K
			new Array<WordCell>(22),  //L
			new Array<WordCell>(20),  //M
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
		
		
		/*
		let columns = this.columns;

		//number of rows in top-left (2 less due to header)
		let nRowsInQ0 = ROWS_PER_QUAD - 2;  

		if (quad == 0) {
			//Top Left (2 less rows)
			let rows = new Array<Array<WordCell>>(nRowsInQ0);

			for (let r = 0; r < rows.length; r++) {
				rows[r] = [columns[0][r], columns[1][r], columns[2][r]];
			}

			return rows;
		}
		else if (quad == 1) {
			//Bottom Left
			let rows = new Array<Array<WordCell>>(ROWS_PER_QUAD);

			for (let i = 0; i < rows.length; i++) {
				let r = nRowsInQ0 + i;
				rows[i] = [columns[0][r], columns[1][r], columns[2][r]];
			}

			return rows;
		}
		else if (quad == 2) {
			//Top Right
			let rows = new Array<Array<WordCell>>(ROWS_PER_QUAD);

			for (let r = 0; r < rows.length; r++) {
				rows[r] = [columns[3][r], columns[4][r], columns[5][r]];
			}

			return rows;
		}
		else if (quad == 3) {
			//Bottom Right
			let rows = new Array<Array<WordCell>>(ROWS_PER_QUAD);

			for (let i = 0; i < rows.length; i++) {
				let r = ROWS_PER_QUAD + i;
				rows[i] = [columns[3][r], columns[4][r], columns[5][r]];
			}

			return rows;
		}
		else {
			throw new Error('invalid quad number ' + quad);
		}		*/
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

/*
Given a word number, get it's X,Y coordinate.

export class XYMapper {
	//Width of each cell
	cellW: number;
	//Height of each cell
	cellH: number;
	
	constructor(canvasWidth:number, canvasHeight:number) {
		//bugfix: Math.floor() causes too much inaccuracy for smaller canvases
		this.cellW = canvasWidth / 6;
		this.cellH = canvasHeight / (ROWS_PER_QUAD * 2);
	}

	/*
	Given a word number (1-256), get the [X,Y] coordinate of the
	top-left corner of the cell rectangle.
	
	getWordXY(wordNum:number): Array<number> {
		if (wordNum < 1 || wordNum > 256)
			throw new Error('wordNum out of range: ' + wordNum);

		let wordIdx = wordNum - 1;

		//See WordLayout.assignWords() for how word numbers are mapped to columns and rows.

		let x:number, y:number;

		if (wordIdx < (NRLeft*3)) {
			//word is on the left side
			let col = Math.floor(wordIdx / NRLeft);
			let row = wordIdx % NRLeft;

			x = col * this.cellW;
			y = (row + 2) * this.cellH;			
		} else {
			//word is on the right
			let tmp = (wordIdx - (NRLeft*3));
			let col = 3 + Math.floor(tmp / NRRight);
			let row = tmp % NRRight;

			x = col * this.cellW;
			y = row * this.cellH;			
		}


		return [x, y];
	}
}
*/
