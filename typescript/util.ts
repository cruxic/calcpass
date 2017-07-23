
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
