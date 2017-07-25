
/*A stream of bytes read one at a time.*/
export interface ByteSource {
	/*Throws if byte source is exhausted.*/
	NextByte():number;
};


/**Write zero into any array-like object.*/
export function erase(array):any {
	for (let i = 0; i < array.length; i++)
		array[i] = 0;
}

/**Build an incrementing sequence of bytes (handy for unit testing).*/
export function byteSeq(start:number, count:number): Uint8Array {
	let res = new Uint8Array(count);
	for (let i = 0; i < count; i++) {
		res[i] = (start + i) & 0xFF;
	}

	return res;
}

/**Create a random integer from [0, n) where n is <= 256.
This function returns uniformly distributed numbers (no modulo bias).

Throws an error if the random source is exhausted or n exceeds 256.
*/
export function UnbiasedSmallInt(source:ByteSource, n:number):number {
	//Solutions from:
	//  https://zuttobenkyou.wordpress.com/2012/10/18/generating-random-numbers-without-modulo-bias/

	const randmax = 255;
	
	if (n <= 0 || n > (randmax + 1) || n !== Math.floor(n)) {
		throw new Error("UnbiasedSmallInt: n out of range: " + n);
	}
	
	let limit = randmax - ((randmax+1) % n)
	let r:number;
	
	while (true) {
		r = source.NextByte();
		if (r <= limit)
			return r % n;
	}
}
