"use strict";


function selftest() {
	sha256.selftest();
	shared_selftest();
	
	assertEq(CHECKWORDS.length, 1024);
	
	console.log('selftest PASSED');
}


function hashToCheckword(bytes) {
	var index = bytes.words[0] & (CHECKWORDS.length - 1);  //CHECKWORDS.length must be a power of 2
	return CHECKWORDS[index];
}

var gWorkers = new Array(4);
var gNWorkersDone = gWorkers.length;
var gStartMs = null;
var gOrigTitle = document.title;

function onMessageFromWorker(e) {
	//`this` holds the worker index
	var worker = gWorkers[this];
	var i, j;
	
	if (e.data.OK) {
		gNWorkersDone++;
		
		worker.resultBytes = sha256.Bytes.fromWordArray(e.data.result);
		
		if (gNWorkersDone == gWorkers.length) {
			//XOR all the worker hashes together
			var combined = gWorkers[0].resultBytes;
			gWorkers[0].resultBytes = null;
			for (i = 1; i < gWorkers.length; i++) {
				for (j = 0; j < combined.words.length; j++)
					combined.words[j] ^= gWorkers[i].resultBytes.words[j];
				gWorkers[i].resultBytes.erase();
			}
		
			var elaspsedMs = Math.round(performance.now() - gStartMs);
			var nSeconds = roundn(elaspsedMs / 1000, 1);
			setProgress(1.0);
			
			onHashingComplete(nSeconds, combined);
		}
	}
	else if (e.data.Progress) {
		worker.itersDone = e.data.itersDone;
		
		var total = gWorkers.length * e.data.nIterations;
		
		var totalDone = 0;
		for (i = 0; i < gWorkers.length; i++)
			totalDone += gWorkers[i].itersDone;
			
		setProgress(totalDone / total);

	}
}

function onErrorFromWorker(error) {
	var msg = 'Worker failed: ' + error.message + ' (line ' + error.lineno + ' of ' + error.filename + ')';
	console.log(msg);
	showError(msg);
}

function setProgress(percent) {	
	var percentStr = '' + Math.floor(percent * 100.0);
	
	var elmBar = document.getElementById('progressBar');
	elmBar.style.width = percentStr + '%';
	
	setElmText('progressPercent', percentStr + '%');	
}

function on_btnCalculate() {
	if (gNWorkersDone != gWorkers.length) {
		console.log('Ignoring on_btnCalculate because already hashing');
		return;
	}

	hideError();
	
	toggleBlock('result', false);
	
	//Ensure site name has been simplified before reading it from the input
	onSitenameChange();
	var sitename = document.getElementById('sitename').value.trim();
	
	if (sitename.length == 0) {
		showError('Please enter a website name');
		document.getElementById('sitename').focus();
		return;
	}

	var pass = document.getElementById('pass').value.trim();
	if (pass.length < 8) {
		document.getElementById('pass').focus();
		if (pass.length == 0)
			showError('Card Lock password is required');
		else
			showError('Card Lock password must be at least 8 characters.  See help (above) for tips on creating a strong password.');
		return;
	}
			
	//Disable the button so that it can't be clicked twice
	document.getElementById('btnCalculate').disabled = true;
	
	document.title = gOrigTitle;
	
	toggleBlock('hashStats', false);
	toggleBlock('progressBorder', true);
	
	
	refreshCheckword();
	
	//Hash the password to obscure it as we pass it to child workers.
	//Append card type to the password so that the check-word will be different
	// for different card types.
	var CARD_TYPE = 'A';
	sha256.selftest();
	var passBytes = sha256.digestString(pass + CARD_TYPE);
	pass = null;
	assert(passBytes.nbytes == 32);
	
	//Create the workers
	var i;
	var nocache = Math.floor(Math.random() * 100000);
	for (i = 0; i < gWorkers.length; i++) {
		//First call spawns the workers.
		if (gWorkers[i] == null) {
			//solution?  http://stackoverflow.com/questions/21408510/chrome-cant-load-web-worker
			gWorkers[i] = new Worker('worker.js?nocache=' + nocache);
			
			//bind onMessageFromWorker so that it's `this` is the worker index
			gWorkers[i].onmessage = onMessageFromWorker.bind(i);
			gWorkers[i].onerror = onErrorFromWorker;
		}
		
		gWorkers[i].itersDone = 0;
		gWorkers[i].resultBytes = null;
	}
	
	//Start them working
	var msg, temp;	
	gStartMs = performance.now();
	gNWorkersDone = 0;
	for (i = 0; i < gWorkers.length; i++) {
		
		//Give each worker a different starting seed
		temp = sha256.hmac(passBytes, sha256.Bytes.fromStringUTF8("" + i));
		msg = {
			START:true,
			initialWords: temp.toWordArray(),
			workerName: "#" + i,
			nIterations: 100000			
		};				
		temp.erase();
		
		gWorkers[i].postMessage(msg);
	}
	
	passBytes.erase();
}

function makeCoord(rng) {
	var res = {
		row: CARD_SIDE_INDEX_CHARS[rng.randSmallInt(CARD_CHAR_H * 2)],
		col: CARD_TOP_INDEX_CHARS[rng.randSmallInt(CARD_CHAR_W)],
		row_col: null
	};
	
	res.row_col = res.row + res.col;
	
	return res;
}


function onHashingComplete(totalSeconds, passwordHash) {
	assert(passwordHash.nbytes == 32 && passwordHash.words.length == 8);
	
	var checkWord = hashToCheckword(passwordHash);
	
	var sitename = document.getElementById('sitename').value.trim();
	assert(sitename.length > 0);
	
	//TODO: append revision to sitename
	
	console.log('sitename "' + sitename + '"');
	console.log('passwordHash ' + passwordHash.toHex()); 
	var inpu = sha256.Bytes.fromStringUTF8(sitename);
	console.log('inpu ' + inpu.toHex()); 
	var hash = sha256.hmac(passwordHash, inpu);
	passwordHash.erase();
	passwordHash = null;
	console.log('Hash ' + hash.toHex());
	
	//Create a deterministic random number generator using given hash as the seed.
	var rng = new UnbiasedRNG(new AES128_DRBG(hash));
	hash.erase();
	
	var result = {
		prefix: rng.rand_A_Z() + rng.randSmallInt(10) + 
			rng.rand_A_Z().toLowerCase() + rng.rand_A_Z().toLowerCase(),
		coord1: makeCoord(rng),
		coord2: makeCoord(rng),
	};
	

	toggleBlock('progressBorder', false);

	var hashStatsElm = document.getElementById('hashStats');
	setElmText('hashStats', 'Hashing took ' + totalSeconds + ' seconds.');
	toggleBlock('hashStats', true);
	
	document.title = result.coord1.row_col + ' - ' + result.coord2.row_col;

	toggleBlock('result', true);
	
	setElmText('resPrefix', result.prefix);
	setElmText('resCoord1', result.coord1.row_col);
	setElmText('resCoord2', result.coord2.row_col);	
	setElmText('resPre_1', result.prefix[0]);
	setElmText('resPre_2', result.prefix[1]);
	setElmText('resPre_3', result.prefix.substring(2));
	setElmText('resCoord1_row', result.coord1.row);
	setElmText('resCoord1_col', result.coord1.col);
	setElmText('resCoord2_row', result.coord2.row);
	setElmText('resCoord2_col', result.coord2.col);
	
	//Allow recalculate
	document.getElementById('btnCalculate').disabled = false;
}

function hideError() {
	toggleBlock('errors', false);
}

function showError(msg) {
	var elm = document.getElementById('errors');
	elm.style.display = 'block';
	elm.firstChild.nodeValue = msg;
}

function checkEnterKey(e) {
	if (e.keyCode == 13)
		on_btnCalculate();
}

var gRefreshTimerHandle = null;
function onPassKeyup(e) {
	if (e.keyCode == 13)
		on_btnCalculate();		
	
	clearTimeout(gRefreshTimerHandle);
	gRefreshTimerHandle = null;

	var pass = document.getElementById('pass').value.trim();
	setVisibility('checkwordBox', false);
	if (pass.length >= 8) {		
		gRefreshTimerHandle = setTimeout(refreshCheckword, 1000);  //long delay so as not to reveal too many intermediate checkwords 		
	}
}

function refreshCheckword() {
	var pass = document.getElementById('pass').value.trim();
	if (pass.length >= 8) {
		var hash = sha256.digestString(pass);
		setElmText('checkword', hashToCheckword(hash));
		hash.erase();		
		setVisibility('checkwordBox', true);
	}
	else
		setVisibility('checkwordBox', false);
}



function toggleHelp(helpId) {
	toggleBlock(helpId);
}

function getHostAndFromURL(url) {
	//always lower case
	url = url.toLowerCase();

	//Remove scheme:// prefix
	var idx = url.indexOf('://');
	if (idx != -1)
		url = url.substring(idx + 3);
		
	//Remove the path suffix
	idx = url.indexOf('/');
	if (idx != -1)
		url = url.substring(0, idx);
		
	
		
	return url;	
}

function removeSubdomains(hostname) {
	//For MOST websites using the top and second-level domain name is the best
	// choice.  For example, the login page of homedepot.com appears to
	// be a load-balanced subdomain like (secure2.homedepot.com).
	// Similarly, newegg.com has their login page on secure.newegg.com.
	//
	// However, using the 2nd level domain is not always the best choice.
	// For  example, universities like oregonstate.edu have
	// many subdomains such as osulibrary.oregonstate.edu.
	// Perhaps future versions should allow the user to choose?


	//No IPv6.  This also filters out port numbers however those are not
	// supposed to make it into this function anyway.
	if (hostname.indexOf(':') == -1) {
		var parts = hostname.split('.');
		if (parts.length > 1) {
			// Don't process IPv4 addresses
			var re = new RegExp('[0-9]+');
			if (!re.test(parts[parts.length-1])) {
				//second-level.top-level
				return parts.slice(parts.length-2).join('.');
			}
		}
	}

	return hostname;
}

function clearSitename() {
	document.getElementById('chkVerbatimSitename').checked = true;
	gVerbatimSitename = null;
	toggleBlock('verbatimRow', false);
	document.getElementById('sitename').value = '';
}

var gVerbatimSitename = null;

function onSitenameInput() {
	//reset if user makes it empty
	var elm = document.getElementById('sitename');
	var text = elm.value.trim();
	if (text.length == 0)
		clearSitename();
}

function onSitenameChange() {
	var elm = document.getElementById('sitename');
	var text = elm.value.trim();
	
	//reset if user makes it empty
	if (text.length == 0) {
		clearSitename();
		return;
	}

	//Don't attempt further simplification if the checkbox is unchecked
	if (!document.getElementById('chkVerbatimSitename').checked)
		return;
	
	//Isolate host.name:8080 from http://host.name:8080/some/path?foo=bar
	var hostAndPort = getHostAndFromURL(text);
	elm.value = hostAndPort;
	
	//Attempt heavy simplification
	var simpler = hostAndPort;
	
	//Remove the port
	var idx = simpler.lastIndexOf(':');
	if (idx != -1)
		simpler = simpler.substring(0, idx);
		
	//Remove subdomains (eg foo.bar.com becomes bar.com)
	simpler = removeSubdomains(simpler);
	
	//Show checkbox if heavy simplification did something
	if (simpler != hostAndPort) {
		toggleBlock('verbatimRow', true);
		gVerbatimSitename = hostAndPort;
		elm.value = simpler;
	}
}

function onchkVerbatimSitenameClick() {
	var wantSimple = document.getElementById('chkVerbatimSitename').checked;
	
	if (wantSimple)
		onSitenameChange();
	else if (gVerbatimSitename)
		document.getElementById('sitename').value = gVerbatimSitename;
}

function onLoad() {
	selftest();
	
	var elm;
	
	elm = document.getElementById('pass');
	elm.addEventListener("keyup", onPassKeyup);
	elm.addEventListener('change', refreshCheckword);
	
	//document.getElementById('sitename').addEventListener("keyup", onSitenameInput);
	elm = document.getElementById('sitename');
	elm.addEventListener("input", onSitenameInput);
	elm.addEventListener("blur", onSitenameChange);
	elm.addEventListener("change", onSitenameChange);
	elm.value = '';
	elm.focus();
	
	elm = document.getElementById('chkVerbatimSitename');
	elm.checked = true;
	elm.addEventListener('click', onchkVerbatimSitenameClick);
	//elm.addEventListener('change', onchkVerbatimSitenameClick);

	document.getElementById('btnCalculate').disabled = false;
	
	//TODO: ensure revision zero is selected
	
	//drawAllPatterns('canvAll');
	
	//drawPattern('canv1', Patterns[4], 'Q8');
	
	//drawPattern('canv', Patterns[Patterns.length - 3], 'Q8');
	
	var k = 0;
	
	//var tb = new TitleBarFlasher("8Q", "3L");
	//tb.update();
	

	//drawCard('canv1', CARD_CHAR_W - 1, CARD_CHAR_H - 1);
	
	//drawCard2('canv2', 10,5, Patterns.length - 4);
}
