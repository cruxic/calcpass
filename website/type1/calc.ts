/*
import {stringToUTF8} from './ts/utf8';
import * as hex from './ts/hex';

import * as util from './ts/util';
import * as bytewords from './bytewords';
*/
//import {stringToUTF8} from './ts/utf8';
//import * as sha256 from './ts/sha256';

//import {XYMapper} from './WordLayout';

//import * as hex from './ts/hex';
import {stringToUTF8} from './ts/utf8';
import {ParallelBcryptWorkers} from './ts/ParallelBcryptWorkers';
import * as type1 from './ts/calcpass_type1';

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

	//
	// Site
	let site = <string>Elm('txtSite').value;
	site = type1.normalizeField(site);
	if (site.length == 0) {
		showError('The \"What\" field is required');
		return;
	}

	//
	// Personalization (optional)
	let personalization = <string>Elm('txtPers').value;
	personalization = type1.normalizeField(personalization);


	//
	// Password
	let pass = <string>Elm('coordPass').value;
	pass = pass.trim();
	if (pass.length < 10) {
		showError('Password must be 10 characters or longer.  See tips for how to create a strong memorable password.');
		return;
	}
	let rawPass = stringToUTF8(pass);

	//
	// Site ID
	let siteId = type1.makeSiteId(site, personalization);
	
	let t1 = new Date().getTime();

	Elm('loading_anim').style.display = 'block';
	let hash = await gBcryptWorkers.execute(rawPass, siteId, 12);
	
	let t2 = new Date().getTime();
	console.log('Hashing took ' + (t2 - t1) + 'ms');	
	
	Elm('loading_anim').style.display = 'none';

	let coords = type1.createWordCoordinates(hash, 4);

	let html = [];
	for (let i = 0; i < coords.length; i++) {
		html.push(`<span>${coords[i]}</span>`);
	}
	Elm('coords').innerHTML = html.join('');
	
	Elm('results').style.display = 'block';
	
	
	
	
	//let seconds = ((t2 - t1) / 1000.0).toFixed(2);
	
	
	//	Elm('log').value = 'done in' + (t2 - t1) + 'ms\n' + hex.encode(hash);
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

	Elm('txtSite').addEventListener('blur', function(e) {
		e.target.value = type1.normalizeField(<string>e.target.value);
	});

	Elm('txtPers').addEventListener('blur', function(e) {
		e.target.value = type1.normalizeField(<string>e.target.value);
	});
	

	let btnGo = Elm('btnGo');
	btnGo.addEventListener('click', on_btnGo);
	//btnGo.disabled = true;
	
	
	

	
}


window.addEventListener("load", onLoad);
