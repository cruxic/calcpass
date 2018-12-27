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

let gCalculating = false;

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

//Wrapper to ensure we don't spawn concurrent calculate operations
async function calculate() {
	if (gCalculating)
		return;
	gCalculating = true;
	try {
		await _calculate();
	}
	catch (e) {
		console.log(e);
	}

	gCalculating = false;
}

async function _calculate() {
	Elm('results').style.display = 'none';
	hideError();

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
	let problem = type1.validateCoordinatePassword(pass);
	switch (problem) {
		case type1.PasswordProblem.None:
			//Good!
			break;
		case type1.PasswordProblem.TooShort:
			showError('Password must be at least ' + type1.MIN_COORD_PASS_LEN + ' characters.  See tips for how to create a strong memorable password.');
			return;
		case type1.PasswordProblem.MissingChkword:
			//fallthrough
		case type1.PasswordProblem.WrongChkword:
			showError('Typo or wrong check-word.');
			Elm('chkwordTip').style.display = 'block';
			return;
		default:
			throw Error('no case for ' + problem);
	}
	let rawPass = stringToUTF8(pass.slice(0, -3));  //without checksum word (does not add entropy)

	//hide password if it was showing
	Elm('coordPass').type = 'password';

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
		html.push(`<span class="coord">${coords[i]}</span>`);
	}
	Elm('coords').innerHTML = html.join('');
	document.title = coords.join(' ') + " - CalcPass";

	Elm('results').style.display = 'block';

	new RememberAnimation().start();
}

function hideError() {
	Elm('error').style.display = 'none';
	Elm('chkwordTip').style.display = 'none';
}

function showError(msg:string) {
	let errDiv = Elm('error');
	errDiv.firstChild.nodeValue = msg;
	errDiv.style.display = 'block';
}

//User clicked show/hide password button
function on_reveal_click(e) {
	let passElm = Elm('coordPass');

	if (passElm.type != 'password') {
		//Hide password
		passElm.type = 'password';
	} else {
		//Show password
		passElm.type = 'text';
	}

	//show/hide the checkword
	onPasswordChange();
}

var gPasswordChangeTimer = null;

function onPasswordChange() {
	let passElm = Elm('coordPass');
	let pass = passElm.value.trim();
	let infoElm = Elm('passInfo');

	infoElm.className = 'na';  //remove 'correctCheckword' class

	if (passElm.type == 'text' && pass.length > 0) {
		switch (type1.validateCoordinatePassword(pass)) {
			case type1.PasswordProblem.None:
				infoElm.firstChild.nodeValue = 'Correct check-word!';
				infoElm.className = 'correctCheckword';
				break;
			case type1.PasswordProblem.TooShort:
				infoElm.firstChild.nodeValue = 'Minimum ' + type1.MIN_COORD_PASS_LEN + ' characters.';
				break;
			default:
				infoElm.firstChild.nodeValue = 'Check-word: ' + type1.calcCheckWord(pass) + '';
		}
	}
	//else leave blank
}

function on_coordPass_change(e) {
	Elm('passInfo').firstChild.nodeValue = '\xA0';  //&nbsp;
	hideError();

	//collapse rapid changes using a timer
	if (gPasswordChangeTimer)
		clearTimeout(gPasswordChangeTimer);
	gPasswordChangeTimer = setTimeout(onPasswordChange, 500);
}

function detectEnterKeypress(e) {
	if (e.keyCode == 13) {
		calculate();
		return false;  //no bubble up
	}
}

class RememberAnimation {
	nextStep:number;

	constructor() {
		this.nextStep = 1;
	}

	onTimer() {
		//clear previous highlite
		if (this.nextStep > 1)
			Elm('remember' + (this.nextStep - 1)).className = 'default';

		if (this.nextStep <= 4) {
			//Highlite next
			Elm('remember' + this.nextStep).className = 'hl';
			this.nextStep++;

			setTimeout(this.onTimer.bind(this), 875);
		}
	}

	start() {
		setTimeout(this.onTimer.bind(this), 500);
	}
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

	let siteElm = Elm('txtSite');
	siteElm.addEventListener('blur', function(e) {
		e.target.value = type1.trimURL(type1.normalizeField(<string>e.target.value));
	});
	siteElm.addEventListener('input', hideError);
	siteElm.addEventListener('keyup', detectEnterKeypress);

	let persElm = Elm('txtPers');
	persElm.addEventListener('blur', function(e) {
		e.target.value = type1.normalizeField(<string>e.target.value);
	});
	persElm.addEventListener('input', hideError);
	persElm.addEventListener('keyup', detectEnterKeypress);


	let btnGo = Elm('btnGo');
	btnGo.addEventListener('click', calculate);

	Elm('btnReveal').addEventListener('click', on_reveal_click);

	let passElm = Elm('coordPass');
	passElm.addEventListener('input', on_coordPass_change);
	passElm.addEventListener('keyup', detectEnterKeypress);

	siteElm.focus();
}


window.addEventListener("load", onLoad);
