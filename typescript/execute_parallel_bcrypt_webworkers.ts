/**Spawn Web Worker threads to compute part of the parallel bcrypt hash.*/

import * as parallel_bcrypt from './parallel_bcrypt'
import * as hex from './hex'

export async function execute_parallel_bcrypt_webworkers(numThreads:number,
	plaintextPassword:Uint8Array, salt:Uint8Array, cost:number,
	progressCallback:(percent:number)=>void): Promise<Uint8Array> {

	//I don't wish to send the plain text to each spawned worker because it might be inter-process-communication
	// and I don't know how secure the messaging is.  Instead I'll compute the distinct thread passwords here
	// and send those.
	let threadPasswords = new Array(numThreads);
	let i:number;
	for (i = 0; i < numThreads; i++) {
		threadPasswords[i] = parallel_bcrypt.createDistinctThreadPassword(i, plaintextPassword);
	}

	let saltHex = hex.encode(salt);
	
	let promiseCallbacks = {
		resolve: null,
		reject: null
	};

	let promise = new Promise<Uint8Array>((resolve, reject) => {
		promiseCallbacks.resolve = resolve;
		promiseCallbacks.reject = reject;
	});

	let failed = false;
	let nWorkersDone = 0;
	let workerHashes = new Array(numThreads);
	let lastReportedPercent = 0.0;
	
	//let threadPercents = new Array(numThreads);
	//for (i = 0; i < numThreads; i++)
	//	threadPercents[i] = 0.0;
		

	let onAllWorkersDone = function() {
		let finalHash:Uint8Array;
		try {
			finalHash = parallel_bcrypt.combineThreadHashes(workerHashes);
			progressCallback(1.0);
		}
		catch (e) {
			failed = true;
			promiseCallbacks.reject(e);
			return;
		}

		promiseCallbacks.resolve(finalHash);
	};

	//called when the worker sends a message via postMessage()
	let onMessageFromWorker = function(workerInstance, e) {
		if (!failed) {
			let threadIndex:number = e.data.threadIndex;
			
			if (e.data.PROGRESS) {
				let percent:number = e.data.percent * 0.99;  //reserve the last percent for combineThreadHashes()

				//report the average percent
				//threadPercents[threadIndex] = percent;
				//let avg = 0.0;
				//let i:number;
				//for (i = 0; i < threadPercents.length; i++)
				//	avg += threadPercents[i];
				//percent = avg / threadPercents.length;

				//avoid excessive progress reports - only report in 2% increments
				if (percent - lastReportedPercent >= 0.02 || percent >= 1.0) {
					progressCallback(percent);
					lastReportedPercent = percent;
				}
			} else if (e.data.DONE) {
				workerHashes[threadIndex] = e.data.hash;
				nWorkersDone++;

				//All are done?
				if (nWorkersDone == numThreads)
					onAllWorkersDone();
			}
		}
	};

	//called when the worker throws an exception
	let onErrorFromWorker = function(workerInstance, error) {
		//only reject upon the first error
		if (!failed) {
			failed = true;
			let msg = 'parallel bcrypt worker failed: ' + error.message +
				' (line ' + error.lineno + ' of ' + error.filename + ')';
			promiseCallbacks.reject(msg);
		}
	};


	//Create each worker
	let workers = new Array(numThreads);
	let randint = Math.floor(Math.random() * 10000000);
	for (i = 0; i < numThreads; i++) {
		let worker = new Worker('parallel-bcrypt-webworker.js?cachebust=' + randint);
		worker.onmessage = (e) => {
			onMessageFromWorker(worker, e);
		};

		worker.onerror = (err) => {
			onErrorFromWorker(worker, err);
		};

		workers[i] = worker;
	}

	//Start each worker
	for (i = 0; i < numThreads; i++) {
		let msg = {
			START: true,
			threadIndex: i,
			distinctThreadPasswordAsHex: threadPasswords[i],
			saltHex: saltHex,
			cost: cost,
			//only request progress from the last thread.
			//this avoids excessive thread messaging which
			//shaves off about 200ms on my (slow) laptop.
			//I'm assuming that the last thread launched will
			//usually be the last to finish.
			reportProgress: i == (numThreads - 1),
		};
		workers[i].postMessage(msg);
	}
	
	return promise;
}
