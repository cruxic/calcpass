/**Convert arrays of octets to and from hex strings*/

export function encode(octetArray): string {
	let s = '';
	let tmp, b;
	for (let i = 0; i < octetArray.length; i++) {
		b = octetArray[i];
		if (typeof(b) !== 'number' || b < 0 || b > 255)
			throw new Error('Invalid octet at index ' + i);

		tmp = b.toString(16);
		if (tmp.length == 1)
			s += '0';
		s += tmp;
	}
	
	return s;
}

export function decode(str): Uint8Array {
	if (typeof(str) !== 'string')
		throw new Error('expected string');

	if (str.length % 2 != 0)
		throw new Error('hex.decode: string length is not even!');

	//Verify all characters are valid.  (parseInt ignores problems)
	let re = /^[a-fA-F0-9]*$/
	if (!re.test(str))
		throw new Error('hex.decode: invalid hex');

	let res = new Uint8Array(str.length / 2);

	for (let i = 0; i < str.length; i += 2) {
		res[i >> 1] = parseInt(str.substring(i, i+2), 16);
	}

	return res;
}
