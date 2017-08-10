import * as sha256 from './sha256';
import {stringToUTF8} from './utf8';
import {UnbiasedSmallInt, ByteSource} from './util';
import {HmacCounterByteSource} from './HmacCounterByteSource';

const CARD_xNames = "ABCDEFGHJKLMNPQRSTUVWX";  //skip I and O to avoid ambiguity when rendered with certain fonts
const CARD_W = 22;
const CARD_H = 15;
const CARD_NUM_CODES = 40;
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

export class CodeFromCard {
	bytes:Uint8Array;  //7 bytes (a-z)
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

export function CheckCardCode(lettersFromCard:string, codeNumber:number):CodeFromCard {
	if (!lettersFromCard)
		return null;

	//always lower case
	lettersFromCard = lettersFromCard.trim().toLowerCase();

	let codeBytes = stringToUTF8(lettersFromCard);
	let i:number;
	let c:number;

	if (codeBytes.length != 8)
		return null;

	//must be a-z
	for (i = 0; i < codeBytes.length; i++) {
		c = codeBytes[i];
		if (c < 0x61 || c > 0x7A)
			return null;
	}

	//TODO: verify checksum of the first 7 (also include codeNumber)

	let res = new CodeFromCard();
	res.bytes = codeBytes.slice(0, 7);
	return res;
}

/**Mix SiteKey and card characters using HmacSha256.*/
export function MixSiteAndCard(siteKey:SiteKey, cardCode:CodeFromCard):SiteCardMix {
	//sanity
	if (cardCode.bytes.length != 7)
		throw new Error('CodeFromCard wrong length');

	let mix = new SiteCardMix();
	mix.bytes = sha256.hmac(siteKey.bytes, cardCode.bytes)

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

export function MakeFriendlyPassword12a(seed:PasswordSeed):string {
	let rng = new HmacCounterByteSource(seed.bytes, 128);

	let chars = '';
	let b:number;

	const ascii_a = 0x61;
	const ascii_A = 0x41;
	const ascii_0 = 0x30;

	//Select 11 a-z characters
	for (let i = 0; i < 11; i++) {
		b = UnbiasedSmallInt(rng, 26);

		//Capitalize the first char
		if (i == 0) {
			chars += String.fromCharCode(ascii_A + b);
		} else {
			chars += String.fromCharCode(ascii_a + b);
		}
	}

	//Select 0-9
	b = UnbiasedSmallInt(rng, 10);
	chars += String.fromCharCode(b + ascii_0);
	
	return chars;
}


function xNameFunc(index:number):string {
	if (index >= CARD_xNames.length) {
		throw new Error("XName index out of range");
	}
	
	return CARD_xNames[index];
}

function yNameFunc(index:number):string {
	return (index + 1).toString();
}

class CardCoord {
	//Horizontal coordinate index, starting at 0
	X:number;
	//Vertical coordinate index, starting at 0
	Y:number;
	
	//The human friendly representation (eg "13W").
	HumanX:string;
	HumanY:string;

	toString():string {
		//number then letter
		return this.HumanY + this.HumanX;
	}	
}

function makeCardCoordinatesFromSource(src:ByteSource, count:number, cardSizeX:number, cardSizeY:number,
	xNameFunc:(idx:number)=>string, yNameFunc:(idx:number)=>string):Array<CardCoord> {
		
	let coords:Array<CardCoord> = new Array<CardCoord>(count);
	let coord:CardCoord;

	for (let i = 0; i < count; i++) {
		coord = new CardCoord();
		
		coord.X = UnbiasedSmallInt(src, cardSizeX);
		coord.Y = UnbiasedSmallInt(src, cardSizeY);
		coord.HumanX = xNameFunc(coord.X);
		coord.HumanY = yNameFunc(coord.Y);
		coords[i] = coord;
	}
	
	return coords;
}

export function MakeSiteCoordinates(siteKey:SiteKey, count:number):Array<CardCoord> {
	if (count < 1 || count > 100) {
		throw new Error("invalid coordinate count");
	}

	let src = new HmacCounterByteSource(siteKey.bytes, 128);

	return makeCardCoordinatesFromSource(src, count, CARD_W, CARD_H,
		xNameFunc, yNameFunc);
}

export function GetCardCodeNumber(siteKey:SiteKey):number {
	let src = new HmacCounterByteSource(siteKey.bytes, 128);
	return UnbiasedSmallInt(src, CARD_NUM_CODES) + 1;
}


