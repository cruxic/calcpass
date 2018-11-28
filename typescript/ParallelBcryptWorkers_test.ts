import * as assert from './assert';
import {ParallelBcryptWorkers} from './ParallelBcryptWorkers';

export async function ParallelBcryptWorkers_test():Promise<boolean> {
	let rand = new Date().getTime();  //time in milliseconds
	
	let lastPercent = 0.0;	
	
	//Test 1-8 threads
	for (let n = 1; n <= 8; n++) {
		lastPercent = 0.0;
		let workers = new ParallelBcryptWorkers(n, 'parallel-bcrypt-webworker.js?cachebust=' + rand);		
		workers.progressCallback = function(percent:number) {
			lastPercent = percent;
		};		
		await workers.selftest();
		assert.equal(1.0, lastPercent);
		workers.shutdown();
	}
	
	//Test repeated hashing with same workers
	let workers = new ParallelBcryptWorkers(3, 'parallel-bcrypt-webworker.js?cachebust=' + rand);
	for (let i = 0; i < 5; i++) {
		await workers.selftest();
	}
	workers.shutdown();

	return new Promise<boolean>((resolve)=>{resolve(true);});
}
