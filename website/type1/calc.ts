/*
import {stringToUTF8} from './ts/utf8';
import * as hex from './ts/hex';

import * as util from './ts/util';
import * as bytewords from './bytewords';
*/
//import {stringToUTF8} from './ts/utf8';
//import * as sha256 from './ts/sha256';

//import {XYMapper} from './WordLayout';

import * as hex from './ts/hex';
import {stringToUTF8} from './ts/utf8';
import {execute_parallel_bcrypt_webworkers} from './ts/execute_parallel_bcrypt_webworkers';

/*
function genSecureRandomBytes(nBytes:number): Uint8Array {
	var ar = new Uint8Array(nBytes);
	window.crypto.getRandomValues(ar);
	return ar;
}
*/

/*Credit card dimensions: 85.60 × 53.98 mm*/
//const QUAD_ASPECT = 54.0 / 86.0;  //0.627906977
async function on_btnGo() {
	let salt = new Uint8Array([0x71,0xd7,0x9f,0x82,0x18,0xa3,0x92,0x59,0xa7,0xa2,0x9a,0xab,0xb2,0xdb,0xaf,0xc3]);
	let pass = stringToUTF8("Super Secret Password");
	
	let progbarElm = <any>document.getElementById('progbar');
	
	let progFunc = function(percent:number) {
		var percStr = Math.floor(percent * 100.0) + '%';
		progbarElm.style.width = percStr;
		progbarElm.firstChild.nodeValue = percStr;
	};
	
	let t1 = new Date().getTime();

	let hash = await execute_parallel_bcrypt_webworkers(4, pass, salt, 12, progFunc);
	
	let t2 = new Date().getTime();
	
	let seconds = ((t2 - t1) / 1000.0).toFixed(2);
	progbarElm.firstChild.nodeValue = progbarElm.firstChild.nodeValue + ' (Took ' + seconds + ' seconds)';
	
	(<any>document.getElementById('log')).value = 'done in' + (t2 - t1) + 'ms\n' + hex.encode(hash);
}

function onLoad() {
	document.getElementById('btnGo').addEventListener('click', on_btnGo);
	
	
	

	
}


window.addEventListener("load", onLoad);
