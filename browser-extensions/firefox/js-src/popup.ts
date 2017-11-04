import * as firefox from './firefox';
import * as calcpass2017a from './calcpass2017a';
import {execute_parallel_bcrypt_webworkers} from './execute_parallel_bcrypt_webworkers';
import {stringToUTF8} from './utf8';
import {erase} from './util';
import * as hex from './hex'
import * as calcpass_misc from './calcpass_misc'

let gCurrentScreen = null;

class ContentFrameInfo {
	tabId:number;
	frameId:number;
	origin:string;
	//hasFocusedInput:boolean;
	hasChildFrames:boolean;
}

//let gContentFrames = new Array<ContentFrameInfo>();

//The content frame which had the focused password field
//when the user clicked the toolbar.
//If there was no focused input this will point to the root frame.
//let gTargetFrame:ContentFrameInfo = null;

//holds the root frame
let gRootFrame:ContentFrameInfo = null;

let gAllFrames = new Array<ContentFrameInfo>();

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

	gCurrentScreen = screen;

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
/*
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
*/
class Context {
	//the scheme, host and port that was in the address bar
	//when the user started calculating the password.
	//Example: '["https","example.com",8080]'
	origin:string = null;

	//The host name or program name the user chose to
	//calculate a password for (not necessarily a domain
	// name)
	sitename:string = null;
	
	stretchTookMillis:number = 0;
	
	siteKey: calcpass2017a.SiteKey = null;
	revision:number = 0;

	/*toPlainObject():any {
		return {
			origHostname: this.origHostname,
			sitename: 
		};
	}*/
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
		
		let stretchedMaster = await calcpass2017a.StretchMasterPassword(pass, userEmail, pbc);
		
		let t2 = performance.now();
		this.ctx.stretchTookMillis = Math.ceil(t2 - t1);

		erase(this.plaintext);
		this.plaintext = null;

		setScreen(new PromptCardCode(this.ctx, stretchedMaster));
	}
}

class PromptCardCode {
	html:string;

	ctx:Context;
	elm_chars:any = null;
	codeNum:number;
	
	constructor(ctx:Context, stretchedMaster:calcpass2017a.StretchedMaster) {
		this.ctx = ctx;

		ctx.siteKey = calcpass2017a.MakeSiteKey(stretchedMaster, ctx.sitename, ctx.revision);

		erase(stretchedMaster.bytes);
		stretchedMaster.bytes = null;

		//Remember the siteKey in RAM of the background script so that we can skip the lengthy
		// stretching step if the user requests the same password again
		firefox.sendMessage({
			SET_STATE:true,
			origin: ctx.origin,
			sitename: ctx.sitename,
			revision: ctx.revision,
			siteKeyHex: hex.encode(ctx.siteKey.bytes)
		});

		this.codeNum = calcpass2017a.GetCardCodeNumber(ctx.siteKey);
		
		this.html = `
		<table>
		<tr>
		<td>
			Enter code <span class="codeNum">${this.codeNum}</span> from your card.
			<p>
			<input id="chars" type="password" size="8" maxlength="8"/>
			<img src="/icons/reveal.png" alt="reveal" title="TODO" style="height:20px" />
			<button id="next">OK</button>
		</td>
		<td>
			<img src="img/enter-card-code.png" style="width: 5em; margin-left: 2em;" alt="picture of card"/>
		</td>
		</tr>
		</table>
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

		let codeFromCard = calcpass2017a.CheckCardCode(chars, this.codeNum);
		if (!codeFromCard) {
			showErr('Checksum failed.  Typo?  Wrong code?');
			return;
		}

		let siteCardMix = calcpass2017a.MixSiteAndCard(this.ctx.siteKey, codeFromCard);

		erase(codeFromCard);

		setScreen(new StretchingFinal(this.ctx, siteCardMix));
	}
}

class StretchingFinal {
	html:string;

	elm_progBar:any = null;
	elm_progPercent:any = null;
	ctx:Context;
	siteCardMix:calcpass2017a.SiteCardMix;
	
	constructor(ctx:Context, siteCardMix:calcpass2017a.SiteCardMix) {
		this.ctx = ctx;
		this.siteCardMix = siteCardMix;
		this.html = `
		<div class="progressBar">
			<div id="progBar">Stretching card code. <span id="progPercent">0%</span></div>
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
		let pbc = new calcpass2017a.ParallelBcrypt();
		pbc.execute = execute_parallel_bcrypt_webworkers;
		pbc.progressCallback = (percent:number) => {
			this.setProgressBar(percent);
		};

		let passwordSeed = await calcpass2017a.StretchSiteCardMix(this.siteCardMix, pbc);

		let password = calcpass2017a.MakeFriendlyPassword12a(passwordSeed);

		erase(this.siteCardMix);
		erase(passwordSeed);

		//Remember the password in RAM of the background script for a short period of time
		firefox.sendMessage({
			SET_STATE:true,
			origin: ctx.origin,
			sitename: ctx.sitename,
			revision: ctx.revision,
			password: password
		});		

		setScreen(new PasswordReady(this.ctx, password));
	}
}

class PasswordReady {
	html:string;

	ctx:Context;
	elm_warnCopy = null;
	didCopyWarning = false;
	elm_showPassDiv = null;
	password:string;
	
	
	constructor(ctx:Context, password:string) {
		this.ctx = ctx;

		//Send the password to all our content-scripts
		//TODO: use a random shared secret stored in local storage to sign each message and xor the password.
		//Should I use window.crypto for the sha256 to keep the content-script light?
		//Perhaps it would be best to prove out the attack(s) I am trying to prevent...
		firefox.sendMessageToAllContentScriptsInTab(gRootFrame.tabId, {
			PASSWORD_READY:true,
			password: password,
		});
		

		this.password = password;

		this.html = `
			<h2>Password Ready</h2>
			<p>
			To insert your password, select the desired password field and press the <b>Control</b> key.
			<p>
			<button id="btnShow">Show Password</button>
			<button id="btnCopy">Copy to Clipboard</button>
			<div id="warnCopy" style="display:none; width: 85%;">
				Copying makes the password visible to every
				program on this computer, including
				Malware and Spyware.  Click Copy again
				to confirm.
			</div>
			<div id="showPassDiv" style="display:none">
				<table border="1">
					<tr>
						<td>Abcd</td>
						<td>efgh</td>
						<td>ijk1</td>
					</tr>
				</table>
			</div>
			<div id="err">?</div>
		`;
	}

	event_click_btnShow(e) {
		this.elm_showPassDiv.style.display = 'block';
		//TODO: fill in table

	}

	event_click_btnCopy(e) {
		if (this.didCopyWarning) {
			//this.elm_warnCopy.style.display = 'none';
			this.elm_warnCopy.firstChild.nodeValue = 'Copied';
			showErr('copy not yet ready');
			return;
		} else {
			this.didCopyWarning = true;
			this.elm_warnCopy.style.display = 'block';
		}
	}
	

}

function escapeHTML(text:string): string {
	//TODO
	return text;
}

class PromptParameters {
	html:string;
	elm_selSite = null;

	elm_jumble_symbols:any = null;
	elm_spanJumbleSymbols:any = null;
	elm_pass = null;
	elm_selFormat = null;
	
	shortDomain:string;
	fullDomain:string;
	ctx:Context;

	contentFrames:Array<ContentFrameInfo>;
		
	
	constructor() {
		//Parse '["https","example.com",8080]'
		let rootOrigin = JSON.parse(gRootFrame.origin);
		if (rootOrigin.length != 3 || !rootOrigin[0] || !rootOrigin[1])
			throw new Error('Invalid origin');
			
		
		let hostname = rootOrigin[1].toLowerCase();

		this.ctx = new Context();
		this.ctx.origin = gRootFrame.origin;

		//TODO: show warning if not HTTPS
		//let isHTTPS = scheme.toLowerCase() === 'https';
		
		this.shortDomain = calcpass_misc.removeSubdomains(hostname);
		this.fullDomain = hostname;

		this.html = `<h2>Calculate Password</h2>
		<div class="inputRow">
			<label class="pushRight" for="selSite">Password For:</label>
			<select id="selSite">
				<option value="short" selected="selected">${escapeHTML(this.shortDomain)}</option>
				<option value="full">${escapeHTML(this.fullDomain)}</option>
				<option value="other">Other</option>
			</select>
		</div>
		<div class="inputRow">
			<label class="pushRight" for="selRev">Password Revision:</label>
			<select id="selRev">
				<option value="0" selected="selected">0</option>
				<option value="1">1</option>
				<option value="2">2</option>
				<option value="3">3</option>
				<option value="4">4</option>
				<option value="other">Other</option>
			</select>
		</div>
		<div class="inputRow">
			<label class="pushRight" for="selFormat">Password Format:</label>
			<select id="selFormat" title="Example: Alqingezioe7">
				<option value="default" selected="selected">Default</option>
				<option value="sixteen">Sixteen</option>
				<option value="jumble">Jumble</option>
				<!-- I do not wish to offer any choice which could yield a password weaker than
				the default format because that opens an attack vector. -->
			</select>
			<span id="spanJumbleSymbols" style="display:none"> with <input id="jumble_symbols" type="text" size="2" value="@,"/></span>
		</div>
		<div class="inputRow">
			<label class="pushRight" for="pass">Master Password</label>
			<input id="pass" type="password" value="" size="20"/>
			<img src="/icons/reveal.png" alt="reveal" title="TODO" style="height:20px" />
		</div>
		<div id="err">?</div>
		<div style="margin-top: 2em">
			<button id="btnNext" style="width: 10em; float:right; margin-right: 1em;">Next</button>
		</div>		
		`;		
	}

	on_selFormat_change(e) {
		let jumble = this.elm_selFormat.value == 'jumble';
		this.elm_spanJumbleSymbols.style.display = jumble ? 'inline' : 'none';
	}

	event_click_btnNext(e) {
		let pass = this.elm_pass.value.trim();
		if (pass.length < 8) {
			showErr('Master Password must be 8 characters.');
			return;
		}

		let hostname:string;
		switch (this.elm_selSite.value) {
			case 'short':
				hostname = this.shortDomain;
				break;
			case 'full':
				hostname = this.fullDomain;
				break;
			case 'other':
				showUnexpectedError('selSite other not yet implemented');
				return;
			default:
				showUnexpectedError('invalid selSite');
				return;
		}

		this.ctx.sitename = hostname;
		//TODO: assign format etc
		
		let rawPlain = stringToUTF8(pass);	
		setScreen(new StretchingMasterPass(this.ctx, rawPlain));		
	}

	onScreenReady() {
		this.elm_selFormat.addEventListener('change', (e) => {this.on_selFormat_change(e);});
	
		this.elm_pass.focus();

		
	}
}

/*class WarnNoSelectedInput {
	html:string;
	
	constructor() {
		this.html =`
			<h2>No Field Selected</h2>
			<p>
			Please select a password or text field on the current web page.
			<p>
			If you wish to calculate a password but not insert it into this web
			page you can <a href="#">proceed anyway</a>.
		`;

	}
}*/

class WarnUnableToLoadContentScript {
	html:string;
	
	constructor() {
		this.html =`
			Please browse to the website which you need a password for.
			<p>
			If you wish to calculate a password but not insert it into a web
			page you can <a href="#">proceed anyway</a>.
		`;
	}
}

async function showFirstScreen() {
	//Skip some prompts if the user has already entered info for this origin.
	//The state is remembered in RAM by the background-script.
	let state = await firefox.sendMessage({GET_STATE:true});
	if (state && state.origin === gRootFrame.origin) {
		/*
		if (state.password)
			setScreen(new PasswordReady(ctx, state.password));
		else if (state.siteKeyHex)
			setScreen(new PromptCardCode(
		*/
			
		

	}


	setScreen(new PromptParameters());
}

function onMessage(msg, sender) {
	console.log('popup onMessage: ', JSON.stringify(msg));

	//If sent from the content-script, get the tabId and frameId
	let cfi = null;
	if (sender.tab) {
		cfi = new ContentFrameInfo();
		cfi.tabId = sender.tab.id;
		cfi.frameId = sender.frameId;
	}

	//sender is a runtime.MessageSender

	if (msg.CONTENT_SCRIPT_READY) {
		if (!cfi)
			throw new Error('Received CONTENT_SCRIPT_READY from unknown tab');

		cfi.origin = msg.origin;
		cfi.hasChildFrames = msg.hasChildFrames;

		//Remember each frame which reports in.
		//We will refuse to reveal the password to any
		//other frame
		gAllFrames.push(cfi);

		//TODO: verify sane origin
		//if (!isSaneOrigin(cfi.origin))
		//	throw ...

		//root frame?
		if (cfi.frameId == 0) {
			if (gRootFrame)
				throw new Error('Multiple CONTENT_SCRIPT_READY from the root frame!');
			gRootFrame = cfi;

			showFirstScreen();
		}
	}
}

//Fires when we get tired of waiting for the child frames to report back
/*function onWarnNoSelectedInputTimeout() {
	//If still no target then show a warning
	if (!gTargetFrame) {
		gTargetFrame = gRootFrame;
		setScreen(new WarnNoSelectedInput());
	}
}*/


async function load() {
	/*
	Our first task is to tell the user the domain name of the website they are logging in to.

	This is made tricky by the fact that some websites use an <iframe> for login (eg gog.com).
	The iframe often has a different domain name.
	
	Other sites have a login <form> which submits to a different domain.  Some sites set the
	<form> action attribute dyamically, with JavaScript, so you can't tell by looking at the markup
	where it will submit to.  I'll bet some sites even do login with AJAX.

	The fact is, when you type a password into a web page, you have no
	guarantee where	that password will be sent to.  You must simply TRUST that the
	parent website will take good care of your precious password.

	So it call comes down to trust.  When I visit example.com and start typing my password
	I must trust example.com.  example.com would not trick me into typing into an <iframe>
	of a malicious website.  Nor would they trick me by submitting the <form> to a malicious website.
	If I don't trust example.com then I shouldn't type a password into it.

	If example.com was trustworthy but is later compromised then it's
	game over - the attacker will get your password and theres little
	we can do to stop it.

	In summary, the calcpass extension will use the domain name which appears
	in the address bar.  It will not use the domain of the <iframe> or the
	domain where the <form> submits to.  This solution is simple,
	easy to explain, and completely deterministic.
	*/

	console.log('popup load()');
	try {
		firefox.addOnMessageListener(onMessage);


		try {
			await firefox.loadContentScriptIntoActiveTab(true);
			//onMessage() will be called repeatedly for each frame which
			// loaded the content script
		}
		catch (e) {
			//This happens when the active tab is not a normal web page (eg about:blank)
			console.log('Unable to load content script: ' + e);
			setScreen(new WarnUnableToLoadContentScript());
			return;
		}
	
	}
	catch (e) {
		showUnexpectedError(e);
	}
}

load();

