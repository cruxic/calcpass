import * as sha256 from './sha256';
import {stringToUTF8} from './utf8';
import {erase} from './util';

const bcryptCost_2017a = 13;

export class StretchedMaster {
	bytes:Uint8Array;  //32 bytes
}

export class SiteKey {
	bytes:Uint8Array;  //32 bytes
}

export class SiteCardMix {
	bytes:Uint8Array;  //32 bytes
}

export class PasswordSeed {
	bytes:Uint8Array;  //32 bytes
}

export function isSaneEmail(s:string):boolean {
	//a@b.c
	return s.length >= 4 && s.indexOf("@") != -1 && s.indexOf(".") != -1;
}

export class ParallelBcrypt {
	execute:(numThreads:number,
		plaintextPassword:Uint8Array, salt:Uint8Array, cost:number,
		progressCallback:(percent:number)=>void)=> Promise<Uint8Array>;

	progressCallback:(percent:number)=>void;
}

export async function StretchMasterPassword(plaintextPassword:Uint8Array,
	userEmail:string, pbcrypt:ParallelBcrypt):Promise<StretchedMaster> {
	if (plaintextPassword.length < 8) {
		throw new Error("password too short");
	}

	userEmail = userEmail.trim().toLowerCase();
	if (!isSaneEmail(userEmail)) {
		throw new Error("Invalid email address");
	}

	let fullSalt = stringToUTF8("calcpass2017a " + userEmail);

	//bcrypt needs exactly 16 bytes
	let salt16 = sha256.hash(fullSalt).slice(0, 16);

	let sm = new StretchedMaster();
	sm.bytes = await pbcrypt.execute(4, plaintextPassword, salt16, bcryptCost_2017a, pbcrypt.progressCallback);

	return new Promise<StretchedMaster>((resolve)=>{resolve(sm)});
}

export function MakeSiteKey(stretchedMaster:StretchedMaster, websiteName:string, revision:number):SiteKey {
	if (!websiteName || websiteName.length < 2) {
		throw new Error("website name too short");
	}

	//ensure integer
	revision = Math.floor(revision);
	
	if (revision < 0) {
		throw new Error("revision cannot be negative");
	}

	//Ensure websiteName is case insensitive
	// (eg "CalcPass.com" should be hash the same as "calcpass.com")
	websiteName = websiteName.trim().toLowerCase();

	let message = stringToUTF8(websiteName + " " + revision);

	let sk = new SiteKey();
	sk.bytes = sha256.hmac(stretchedMaster.bytes, message);
	
	return sk;
}

/**Mix SiteKey and card characters using HmacSha256.*/
export function MixSiteAndCard(siteKey:SiteKey, charactersFromCard:string):SiteCardMix {
	//2017a cards are all lower case.  Also trim white space
	charactersFromCard = charactersFromCard.trim().toLowerCase();

	if (charactersFromCard.length < 8) {
		throw new Error("Too few characters from card");
	}

	let rawChars = stringToUTF8(charactersFromCard);

	//verify a-z
	for (let i = 0; i < rawChars.length; i++) {
		if (rawChars[i] < 0x61 || rawChars[i] > 0x7A)
			throw new Error("charactersFromCard must be a through z");
	}

	let mix = new SiteCardMix();
	mix.bytes = sha256.hmac(siteKey.bytes, rawChars)

	erase(rawChars);

	return mix;
}

export async function StretchSiteCardMix(siteCardMix:SiteCardMix,
	pbcrypt:ParallelBcrypt):Promise<PasswordSeed>
{
	//split in half for key & salt
	let key = siteCardMix.bytes.slice(0, 16);
	let salt = siteCardMix.bytes.slice(16);

	let ps = new PasswordSeed();
	ps.bytes = await pbcrypt.execute(4, key, salt, bcryptCost_2017a, pbcrypt.progressCallback);

	return new Promise<PasswordSeed>((resolve) => {resolve(ps);});
}

/*
export function MakeFriendlyPassword12a(seed:PasswordSeed):string {
	rng := util.NewHmacDrbgByteSource([]byte(seed))

	chars := make([]byte, 12)

	const ascii_a = 0x61
	const ascii_A = 0x41
	const ascii_0 = 0x30

	//Select 11 a-z characters
	for i := 0; i < 11; i++ {
		b, err := util.UnbiasedSmallInt(rng, 26)
		if err != nil {
			//HMAC-DRBG exhausted - extremely unlikely
			return "", err
		}

		//Capitalize the first char
		if i == 0 {
			chars[i] = byte(ascii_A + b)
		} else {
			chars[i] = byte(ascii_a + b)
		}
	}

	//Select 0-9
	b, err := util.UnbiasedSmallInt(rng, 10)
	if err != nil {
		return "", err
	}
	chars[11] = byte(b + ascii_0)

	s := string(chars)
	util.Erase(chars)
	
	return s, nil
}*/

