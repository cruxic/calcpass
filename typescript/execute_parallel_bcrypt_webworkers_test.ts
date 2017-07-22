import * as assert from './assert';
import * as hex from './hex';
import {stringToUTF8} from './utf8';
import {execute_parallel_bcrypt_webworkers} from './execute_parallel_bcrypt_webworkers';

export async function execute_parallel_bcrypt_webworkers_test():Promise<boolean> {
	//same test parameters as parallel_bcrypt_test
	let salt = new Uint8Array([0x71,0xd7,0x9f,0x82,0x18,0xa3,0x92,0x59,0xa7,0xa2,0x9a,0xab,0xb2,0xdb,0xaf,0xc3]);
	let pass = stringToUTF8("Super Secret Password");

	let lastPercent = 0.0;
	let progFunc = function(percent:number) {
		lastPercent = percent;
	};

	let hash = await execute_parallel_bcrypt_webworkers(4, pass, salt, 5, progFunc);

	assert.equal(hex.encode(hash), "2c70a99f125eaa36561e97f0c9d215e099ab991116ceda19b7c3c93c669ebe7e");
	assert.equal(1.0, lastPercent);

	return new Promise<boolean>((resolve)=>{resolve(true);});
}
