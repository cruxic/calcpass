/*This Implements HMAC_DRBG in TypeScript, as per NIST Special Publication 800-90A.
It is a port of my Go implementation https://github.com/cruxic/go-hmac-drbg which
 was in turn ported from https://github.com/fpgaminer/python-hmac-drbg
*/
import * as sha256 from './sha256'


/**937 bytes (~7500 bits) as per the spec.*/
export const MaxBytesPerGenerate = 937  // ~ 7500bits/8

/**Entropy for NewHmacDrbg() and Reseed() must never exceed this number of bytes.*/
export const MaxEntropyBytes = 125      // = 1000bits

export const MaxPersonalizationBytes = 32 // = 256bits

function _hmac(key:Uint8Array, message:Uint8Array): Uint8Array {
	return sha256.hmac(key, message);
}

//Because TypedArray.fill() is not supported by older browsers.
function fill(data:Uint8Array, value:number) {
	for (let i = 0; i < data.length; i++)
		data[i] = value;
}

export class HmacDrbg {
	/**The effective security level (eg 128 bits) which this generator was instantiated with.*/
	SecurityLevelBits:number

	k:Uint8Array
	v:Uint8Array
	
	reseedCounter:number

	/**Create a new DRBG.
	desiredSecurityLevelBits must be one of 112, 128, 192, 256.

	entropy length (in bits) must be at least 1.5 times securityLevelBits.
	entropy byte length cannot exceed MaxEntropyBytes.

	The personalization can be nil.  If non-nil, it's byte length cannot exceed MaxPersonalizationBytes.

	If any of the parameters are out-of-range this function will panic.
	*/
	constructor(securityLevelBits:number, entropy:Uint8Array, personalization?:Uint8Array) {
		if (securityLevelBits != 112 && 
			securityLevelBits != 128 &&
			securityLevelBits != 192 &&
			securityLevelBits != 256) {
			
			throw new Error("Illegal desiredSecurityLevelBits");
		}
		
		if (entropy.length > MaxEntropyBytes) {
			throw new Error("Input entropy too large");
		}
		
		if ((entropy.length * 8 * 2) < (securityLevelBits * 3)) {
			throw new Error("Insufficient entropy for security level");
		}
		
		if (personalization !== null && personalization.length > MaxPersonalizationBytes) {
			throw new Error("Personalization too long");
		}

		this.SecurityLevelBits = securityLevelBits;
		this.k = new Uint8Array(32);
		this.v = new Uint8Array(32);
		this.reseedCounter = 1;
		
		//Instantiate
		//k already holds 0x00.
		//Fill v with 0x01.
		fill(this.v, 0x01);
		
		let nPers = (personalization !== null) ? personalization.length : 0;
		
		let seed = new Uint8Array(entropy.length + nPers);
		seed.set(entropy, 0);  //copy from entropy to seed
		if (personalization !== null) {
			//append personalization
			seed.set(personalization, entropy.length);
		}
		
		this.update(seed);
	}

	update(providedData?:Uint8Array) {
		let nProvided = (providedData !== null) ? providedData.length : 0;

		let msg = new Uint8Array(this.v.length + 1 + nProvided);
		msg.set(this.v);  //copy v to msg
		
		//leave hole with 0x00 at msg[len(this.v)]
		if (providedData != null) {
			msg.set(providedData, this.v.length + 1);
		}

		this.k = _hmac(this.k, msg);
		this.v = _hmac(this.k, this.v);

		if (providedData != null) {
			msg.set(this.v);
			msg[this.v.length] = 0x01;
			msg.set(providedData, this.v.length + 1);
			
			this.k = _hmac(this.k, msg);
			this.v = _hmac(this.k, this.v);
		}
	}		

	Reseed(entropy:Uint8Array) {
		if (entropy.length * 8 < this.SecurityLevelBits) {
			throw new Error("Reseed entropy is less than security-level");
		}
		
		if (entropy.length > MaxEntropyBytes) {
			throw new Error("Reseed entropy exceeds MaxEntropyBytes");
		}
		
		this.update(entropy);
		this.reseedCounter = 1;
	}

		
	/**Fill the given byte array with random bytes.
	Returns false if a reseed is necessary first.
	This function will panic if the array is larger than MaxBytesPerGenerate.*/
	Generate(outputBytes:Uint8Array): boolean {
		let nWanted = outputBytes.length;
		if (nWanted > MaxBytesPerGenerate) {
			throw new Error("HmacDrbg: generate request too large.");
		}
		
		if (this.reseedCounter >= 10000) {
			//set all bytes to zero, just to be clear
			fill(outputBytes, 0);
			return false;
		}

		let nGen = 0;
		let n:number;
		while (nGen < nWanted) {
			this.v = _hmac(this.k, this.v);
			
			n = nWanted - nGen;
			if (n >= this.v.length) {
				n = this.v.length;
				outputBytes.set(this.v, nGen);
				nGen += this.v.length;
			} else {
				for (let i = 0; i < n; i++)
					outputBytes[nGen++] = this.v[i];
			}
		}

		this.update(null);
		this.reseedCounter++;
		
		return true;
	} 


}

/**Read from an arbitrary number of bytes from HmacDrbg efficiently.
Internally it generates blocks of MaxBytesPerGenerate.  It then
serves these out through the standard `Read` function.  Read returns
an error if reseed becomes is necessary.
*/
/*
type HmacDrbgReader struct {
	Drbg *HmacDrbg
	buffer []byte //size MaxBytesPerGenerate
	offset int
}


func NewHmacDrbgReader(drbg *HmacDrbg) *HmacDrbgReader {
	return &HmacDrbgReader{
		Drbg: drbg,
		buffer: make([]byte, MaxBytesPerGenerate),
		offset: MaxBytesPerGenerate,
	}
}

func (self *HmacDrbgReader) Read(b []byte) (n int, err error) {
	nRead := 0
	nWanted := len(b)
	for nRead < nWanted {
		if this.offset >= MaxBytesPerGenerate {
			if !this.Drbg.Generate(this.buffer) {
				return nRead, errors.New("MUST_RESEED")
			}
			this.offset = 0
		}
		
		b[nRead] = this.buffer[this.offset]
		nRead++
		this.offset++
	}
	
	return nRead, nil
}
*/
