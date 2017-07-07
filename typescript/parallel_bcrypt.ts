import * as bcrypt from './bcrypt'
import {stringToUTF8} from './utf8'
import * as sha256 from './sha256'
import * as hex from './hex'

function erase(data:Uint8Array) {
	let i:number;
	for (i = 0; i < data.length; i++) {
		data[i] = 0;
	}
}

function checkParams(plaintextPassword:Uint8Array, salt:Uint8Array, cost:number) {
	if (!plaintextPassword.length)
		throw new Error("parallel_bcrypt: empty password!");
	if (salt.length != bcrypt.saltSize)
		throw new Error("parallel_bcrypt: wrong salt length. bcrypt requires " + bcrypt.saltSize + " bytes");
	if (cost < 4 || cost > 32)
		throw new Error("parallel_bcrypt: bcrypt cost must be between 4 and 32.");
}

export function hashThread(threadIndex:number, plaintextPassword:Uint8Array, salt:Uint8Array, cost:number): string {
	checkParams(plaintextPassword, salt, cost);

	//Derive a distinct password for this thread to work on:
	//  eg: sha256(plaintextPassword + 0x01)
	let sha = new sha256.Hash();
	sha.update(plaintextPassword);
	sha.update(new Uint8Array([threadIndex + 1]));
	let threadPassword = sha.digest();
	sha.clean();
	sha = null;

	//Some bcrypt implementations are broken (eg PHP) because they truncate
	// the password at the first null byte!  Therefore I'll pass 64 hex characters.
	//(bcrypt can handle up to 72 bytes)
	let hexPass = hex.encodeToUint8Array(threadPassword);
	erase(threadPassword);
	threadPassword = null;

	//Hash it!
	let hash64 = bcrypt.bcrypt(hexPass, salt, cost);

	if (hash64.length != 60)
		throw new Error("bcrypt returned wrong size");
	
	//remove the salt and cost prefix (first 29 chars)
	hash64 = hash64.substring(29);

	return hash64;
}

/**
@param hashes the hash result from each thread, sorted by thread index ascending.
Always returns 32 bytes.
*/
export function combineThreadHashes(hashes: Array<string>): Uint8Array {
	if (!hashes.length) {
		throw new Error("parallel_bcrypt: empty array!");
	}

	let sha = new sha256.Hash();
	let i:number;
	for (i = 0; i < hashes.length; i++) {
		if (hashes[i].length != 31)
			throw new Error("parallel_bcrypt: wrong hash string length.");
	
		sha.update(stringToUTF8(hashes[i]));
	}

	let res = sha.digest();
	sha.clean();
	return res;	
}


/**Compute the full hash using only a single thread (slow!).  This is mainly for unit testing - normally
you will want to spawn Web Workers which call hashThread().
*/
export function hashWithSingleThread(numSimulatedThreads:number, plaintextPassword:Uint8Array, salt:Uint8Array, cost:number): Uint8Array {
	checkParams(plaintextPassword, salt, cost);

	if (numSimulatedThreads < 1 || numSimulatedThreads > 64)
		throw new Error("parallel_bcrypt: numSimulatedThreads out of range.");

	let hashes = new Array<string>(numSimulatedThreads);

	for (let n = 0; n < numSimulatedThreads; n++) {
		hashes[n] = hashThread(n, plaintextPassword, salt, cost);		
	}

	return combineThreadHashes(hashes);
}
