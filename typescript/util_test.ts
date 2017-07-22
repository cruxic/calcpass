import * as util from './util'
import * as assert from './assert'


export default function util_test() {
	let ar = [1,2,3];
	util.erase(ar);
	assert.equal(0, ar[1]);

	let bytes = new Uint8Array([1,2,3]);
	util.erase(bytes);
	assert.equal(0, bytes[2]);
}
