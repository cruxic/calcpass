"use strict";
var module = null;

importScripts('sha256.js');
importScripts('bcrypt.js');

function assert(cond) {
	if (!cond)
		throw new Error('Assertion failed');
}

//Called when the parent does postMessage()
self.onmessage = function(e) {
	if (e.data.START) {
		var initialWords = e.data.initialWords;
		assert(initialWords.length == 8);
		
		var nIterations = e.data.nIterations;
		assert(nIterations > 0);
		
		var workerName = e.data.workerName;
		
		//console.log('Worker ' + workerName + ' starting ' + nIterations + ' iterations');
		
		//Make sure sha256 is working correctly
		sha256.selftest();

		//var bytes = sha256.Bytes.fromWordArray(initialWords);
		
		//var the_hash = "$2a$12$97DLxVkW2LSZ6eHBoimLw.hYOaYm1JPWjeUAF2NlRjMrKx6Foe1lq";
		//var the_hash = "$2y$15$Jpd3icFNfAzpMESPcC13JOpVcdCUM4K78izJbSd4P/QtTsISOKShi";
		var salt = "$2a$14$97DLxVkW2LSZ6eHBoimLw.";
		var res = dcodeIO.bcrypt._hash("SuperSecretPassword" + workerName, salt);

		//doIterations(bytes, nIterations);
		
		console.log('Worker ' + workerName + ' done res=' + res);
		
		var bytes = sha256.digestString(res);
		
		var msg = {
			OK:true,
			result: bytes.toWordArray()			
		};
		bytes.erase();
		
		postMessage(msg);
	}
	else
		throw new Error('Unrecognized worker message');
	
	//Don't close - parent might request another calculation
	//close();
}

function doIterations(bytes, nIterations) {
	var i, j, temp;
	var nWords = bytes.words.length;
	
	var progressMsg = {
		Progress:true,
		itersDone: 0,
		nIterations: nIterations
	};	
	
	for (i = 0; i < nIterations; i++) {
		if (i % 1000 == 0 && i > 0) {
			progressMsg.itersDone = i;
			postMessage(progressMsg);
		}

		temp = sha256.sha256(bytes);
		
		//XOR and erase
		for (j = 0; j < nWords; j++) {
			bytes.words[j] ^= temp.words[j];
			temp.words[j] = 0;
		}
	}
}

