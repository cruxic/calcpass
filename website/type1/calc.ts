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
import {ParallelBcryptWorkers} from './ts/ParallelBcryptWorkers';

let gBcryptWorkers:ParallelBcryptWorkers = null;

/*
function genSecureRandomBytes(nBytes:number): Uint8Array {
	var ar = new Uint8Array(nBytes);
	window.crypto.getRandomValues(ar);
	return ar;
}
*/

function Elm(id:string): any {
	return document.getElementById(id);
}

/*Credit card dimensions: 85.60 × 53.98 mm*/
//const QUAD_ASPECT = 54.0 / 86.0;  //0.627906977
async function on_btnGo() {
	Elm('results').style.display = 'none';

	let salt = new Uint8Array([0x71,0xd7,0x9f,0x82,0x18,0xa3,0x92,0x59,0xa7,0xa2,0x9a,0xab,0xb2,0xdb,0xaf,0xc3]);
	let pass = stringToUTF8("Super Secret Password");

	/*
	let progbarElm = <any>Elm('progbar');
	
	gBcryptWorkers.progressCallback = function(percent:number) {
		var percStr = Math.floor(percent * 100.0) + '%';
		progbarElm.style.width = percStr;
		progbarElm.firstChild.nodeValue = percStr;
	};*/
	
	
	let t1 = new Date().getTime();

	Elm('loading_anim').style.display = 'block';
	let hash = await gBcryptWorkers.execute(pass, salt, 12);
	
	let t2 = new Date().getTime();
	console.log('Hashing took ' + (t2 - t1) + 'ms');
	
	
	Elm('loading_anim').style.display = 'none';
	Elm('results').style.display = 'block';
	
	
	
	
	//let seconds = ((t2 - t1) / 1000.0).toFixed(2);
	//progbarElm.firstChild.nodeValue = progbarElm.firstChild.nodeValue + ' (Took ' + seconds + ' seconds)';
	
	if (false)
		Elm('log').value = 'done in' + (t2 - t1) + 'ms\n' + hex.encode(hash);
}

function showError(msg:string) {
	//TODO: implement this
	console.log('TODO showError ' + msg);
}

async function onLoad() {
	gBcryptWorkers = new ParallelBcryptWorkers(4, 'parallel-bcrypt-webworker.js?foo');
	try {
		await gBcryptWorkers.selftest();
		console.log('Parallel Bcrypt self-test passed');
	} catch (e) {
		console.log('selftest failed');
		console.log(e);
		showError('Javascript self-test failed.  Please try a different web browser.');
		return;		
	}

	let btnGo = Elm('btnGo');
	btnGo.addEventListener('click', on_btnGo);
	//btnGo.disabled = true;
	
	
	

	
}


window.addEventListener("load", onLoad);
