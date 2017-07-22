import * as firefox from './firefox';
import * as calcpass2017a from './calcpass2017a';
import {execute_parallel_bcrypt_webworkers} from './execute_parallel_bcrypt_webworkers';
import {stringToUTF8} from './utf8';
import {erase} from './util';
//import * as hex from './hex'
import * as calcpass_misc from './calcpass_misc'

function setContent(html) {
	document.getElementById('content').innerHTML = html;
}

function setScreen(screen:Object) {
	if (typeof(screen['html']) != 'string') {
		throw new Error('screen object missing `html` member.');
	}

	setContent(screen['html']);

	//Connect all "event_*" methods to the corresponding document elements
	let k, eventType, elmId, m, elm, func;
	let re_event = /^event_([a-z]+)_(.+)$/
	let re_elm = /^elm_(.+)$/
	for (k in screen) {
		if (k.indexOf('event_') == 0) {
			m = re_event.exec(k);
			if (!m || !m[1] || !m[2]) {
				throw new Error('screen object has invalid event method name: ' + k);
			}

			eventType = m[1];
			elmId = m[2];

			elm = document.getElementById(elmId);
			if (!elm) {
				throw new Error(`screen object has method "${k}" but document has no element "${elmId}"`);
			}

			func = screen[k].bind(screen);
			
			elm.addEventListener(eventType, func);
			console.log(`Connected ${k}`);
		}
		else if (k.indexOf('elm_') == 0) {
			m = re_elm.exec(k);
			if (!m || !m[1]) {
				throw new Error('screen object has invalid elm field name: ' + k);
			}

			elmId = m[1];

			elm = document.getElementById(elmId);
			if (!elm) {
				throw new Error(`screen object has field "${k}" but document has no element "${elmId}"`);
			}

			screen[k] = elm;
			//console.log(`set elm ${k}`);
		}
	}

	//Call onScreenReady if provided
	if (screen['onScreenReady']) {
		screen['onScreenReady']();
	}
}

function setElmText(elementOrId, text:string) {
	let elm = elementOrId;
	if (typeof(elementOrId) == 'string')
		elm = document.getElementById(elementOrId);

	if (!elm || !elm.firstChild) {
		console.log('setElmText: ' + elementOrId + ' is missing or has no firstChild');
		return;
	}
		
	elm.firstChild.nodeValue = text;
}

/*
class WelcomeScreen {
	html:string;
	
	constructor() {
		this.html = `
		<b>Welcome to CalcPass!</b>
		<p>
		<button id="btnCreate">Create a new wallet card.</button>
		<button id="btnAlready">I already have a card.</button>
		`;
	}

	event_click_btnCreate(e) {
		console.log('on create!');
		
	}

	event_click_btnAlready(e) {
		console.log('on already!');
	}	
}
*/

/**Called upon an uncaught exception or other fatal error.
Shows a friendly message to the user.
*/
function showUnexpectedError(info:any) {
	console.log('showUnexpectedError was called:');
	console.log(info);
	if (!info)
		info = "?";

	let infoStr = '' + info;

	//fill the <textarea>
	let elm = document.getElementById('unexpected_error_text');
	if (elm)
		elm.firstChild.nodeValue = infoStr;

	//set the support email
	elm = document.getElementById('unexpected_error_email');
	if (elm) {
		let noSpamPlease = 'cruxic' + '@' + 'gmail' + '.' + 'com';
		elm.firstChild.nodeValue = noSpamPlease;
	}	

	//show the <div>
	elm = document.getElementById('unexpected_error');
	if (elm)
		elm.style.display = 'block';

	//hide all other content
	elm = document.getElementById('content');
	if (elm)
		elm.innerHTML = ' ';
}

function showErr(text:string) {
	let elm = document.getElementById('err');
	if (!elm) {
		showUnexpectedError('Screen has no #err element.');
		return;
	}
	
	setElmText(elm, text);

	elm.style.display = 'block';
}

class MasterPassPrompt {
	html:string;
	elm_pass:any = null;

	ctx:Context;
	
	constructor(ctx:Context) {
		this.ctx = ctx;
		this.html = `
		<input id="pass" type="password" placeholder="Master Password" size="20"/>
		<button id="btnOK">OK</button>
		<div id="err">?</div>
		`;
	}

	event_click_btnOK(e) {
		let pass = this.elm_pass.value.trim();
		if (pass.length < 8) {
			console.log('here');
			showErr('Password must be at least 8 characters.');
			return;
		}

		let rawPlain = stringToUTF8(pass);
	
		setScreen(new StretchingMasterPass(this.ctx, rawPlain));

	}

	async onScreenReady() {
		this.elm_pass.focus();

	}
}

class Context {
	sitename:string;
	stretchedMaster:calcpass2017a.StretchedMaster;
	stretchTookMillis:number;
}

class StretchingMasterPass {
	html:string;

	elm_progBar:any = null;
	elm_progPercent:any = null;
	ctx:Context;
	plaintext:Uint8Array;
	
	constructor(ctx:Context, plaintext:Uint8Array) {
		this.ctx = ctx;
		this.plaintext = plaintext;
		this.html = `
		<div class="progressBar">
			<div id="progBar">Stretching password. <span id="progPercent">0%</span></div>
		</div>
		`;
	}

	setProgressBar(percent:number) {
		if (percent < 0.0)
			percent = 0.0;
		if (percent > 1.0)
			percent = 1.0;
			
		var percentStr = '' + Math.floor(percent * 100.0);
		this.elm_progBar.style.width = percentStr + '%';
		setElmText(this.elm_progPercent, percentStr + '%');
	}
	

	async onScreenReady() {
		console.log("TODO: get salt from local storage");
		let userEmail = "a@b.c";
		let pass = this.plaintext;

		let pbc = new calcpass2017a.ParallelBcrypt();
		pbc.execute = execute_parallel_bcrypt_webworkers;
		pbc.progressCallback = (percent:number) => {
			this.setProgressBar(percent);
		};

		let t1 = performance.now();
		
		this.ctx.stretchedMaster = await calcpass2017a.StretchMasterPassword(pass, userEmail, pbc);
		
		let t2 = performance.now();
		this.ctx.stretchTookMillis = Math.ceil(t2 - t1);

		erase(this.plaintext);
		this.plaintext = null;

		setScreen(new ShowCoordinates(this.ctx));
	}
}

class ShowCoordinates {
	html:string;

	ctx:Context;
	elm_chars:any = null;
	
	constructor(ctx:Context) {
		this.ctx = ctx;
		//TODO: calculate coordinates from ctx.stretchedMaster and ctx.sitename and ctx.revision
		
		this.html = `
		<h2>Enter Coordinates</h2>
		<p>
		<b>7P</b>&nbsp;&nbsp;<b>13Q</b>
		<p>
		<input id="chars" type="password" size="8" maxlength="8"/><button>*</button>
		<p>
		<button id="next">OK</button>
		<div id="err">?</div>
		`;
	}

	async onScreenReady() {
		this.elm_chars.focus();
	}

	event_click_next(e) {
		let chars = this.elm_chars.value.trim();
		if (chars.length != 8) {
			showErr("Please enter 8 characters.");
			return;
		}

		
	}
}

function escapeHTML(text:string): string {
	//TODO
	return text;
}

class SelectSiteName {
	html:string;
	elm_shortDomain:any = null;
	elm_other:any = null;
	elm_txtOther:any = null;
	elm_otherOK:any = null;
	
	shortDomain:string;
	fullDomain:string;
		
	
	constructor(scheme:string, hostname:string) {
		this.html = `<h2>Verify Website Name:</h2>`;

		hostname = hostname.toLowerCase();

		//TODO: show warning if not HTTPS
		//let isHTTPS = scheme.toLowerCase() === 'https';
		
		this.shortDomain = calcpass_misc.removeSubdomains(hostname);
		this.fullDomain = hostname;

		this.html += `
		<button id="shortDomain" style="font-weight:bold">${escapeHTML(this.shortDomain)}</button>
		<br/>
		`;

		if (this.shortDomain != this.fullDomain) {
			this.html += `
			<button id="fullDomain">${escapeHTML(this.fullDomain)}</button>
			<br/>
			`;
		}

		this.html += `
		<button id="other">Other</button>
		<input id="txtOther" type="text" value="${escapeHTML(this.fullDomain)}" size="20" style="display:none"/>
		<button id="otherOK" style="display:none">OK</button>
		<br/>
		<div id="err">?</div>
		`;		
	}

	proceed(hostname:string) {
		let ctx = new Context();
		ctx.sitename = hostname;
		setScreen(new MasterPassPrompt(ctx));
	}

	event_click_shortDomain(e) {
		this.proceed(this.shortDomain);
	}

	event_click_fullDomain(e) {
		this.proceed(this.fullDomain);
	}
	
	event_click_otherOK(e) {
		let other = this.elm_txtOther.value.trim().toLowerCase();

		//TODO: better to just disable the OK button when empty?
		if (other.length == 0) {
			showErr('Empty not allowed');
			return;
		}

		this.proceed(other);
	}

	event_click_other(e) {
		this.elm_other.style.display = 'none';
		this.elm_txtOther.style.display = 'inline';
		this.elm_otherOK.style.display = 'inline';
		this.elm_txtOther.focus();				
	}

	onScreenReady() {
		this.elm_shortDomain.focus();
	}
}

async function onMessage(msg, senderInfo) {
	console.log('popup onMessage was called!', JSON.stringify(msg));

	if (msg.CONTENT_SCRIPT_LOADED) {
		console.log('got CONTENT_SCRIPT_LOADED');
		setScreen(new SelectSiteName(msg.location.scheme, msg.location.hostname));
	}

}


async function load() {
	console.log('popup load()');
	try {
		firefox.addOnMessageListener(onMessage);

		try {
			//throws if active tab is not a normal webpage (eg about:blank)
			await firefox.loadContentScriptIntoActiveTab();
		}
		catch (e) {
			console.log('Unable to load content script: ' + e);
			showUnexpectedError('TODO: ask user to select a tab or enter sitename');
			return;
		}


		/*
		

		console.log('tabURL' + tabURL);

		await firefox.localSet({DID_WELCOME: false});

		setScreen(new CardLockPassPrompt());

	/*
	await firefox.localSet({DID_WELCOME: false});

	if ( ! await firefox.localGet('DID_WELCOME')) {
		showWelcome();
	} else {
		setContent('hello old friend!');
	}*/

	
	/*var tabs = await firefox.getActiveTab();
	console.log('tabs ' + typeof(tabs));
	if (tabs.length > 0) {
		console.log(tabs[0].id);
		console.log(tabs[0].url);
	}*/
	//var url = await firefox.getActiveTabURL();
	//console.log('url ' + url);

	/*

	await firefox.loadContentScriptIntoActiveTab();
	console.log('loaded');

	setContent('<b class="cool">loaded!!!</b>');*/
	
	}
	catch (e) {
		showUnexpectedError(e);
	}
}

load();
