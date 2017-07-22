/**This is the script which is spawned as a "thread" in using Web Workers
(https://developer.mozilla.org/en-US/docs/Web/API/Worker)
to calculate a parallel_bcrypt hash.

Use execute_parallel_bcrypt_webworkers() to spawn the workers and calculate
the final hash.
*/
import * as parallel_bcrypt from './parallel_bcrypt'
import * as hex from './hex'

declare var self;
declare function postMessage(obj:any);

//Called when somebody sends a message to this worker instance.
self.onmessage = function(e) {
	if (e.data.START) {
		let threadIndex:number = e.data.threadIndex;

		let distinctThreadPasswordAsHex:string = e.data.distinctThreadPasswordAsHex;
		if (distinctThreadPasswordAsHex.length != 64)
			throw new Error('Invalid distinctThreadPasswordAsHex');

		let salt = hex.decode(e.data.saltHex);
		let cost:number = e.data.cost;

		let progressFunc = (percent:number) => {
			postMessage({PROGRESS:true, percent:percent, threadIndex:threadIndex});
		};

		if (!e.data.reportProgress)
			progressFunc = null;

		let hash = parallel_bcrypt.bcryptDistinctHex(distinctThreadPasswordAsHex, salt, cost, progressFunc);

		postMessage({DONE:true, threadIndex:threadIndex, hash:hash});

		//done with this thread
		self.close();
	}
	else
		throw new Error('Unrecognized message');
};

