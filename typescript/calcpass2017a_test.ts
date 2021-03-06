import * as assert from './assert';
import * as hex from './hex';
import * as sha256 from './sha256';
import {stringToUTF8} from './utf8';
import {byteSeq} from './util';
import * as calcpass2017a from './calcpass2017a';
import {execute_parallel_bcrypt_webworkers} from './execute_parallel_bcrypt_webworkers';

function emptyPromise():Promise<boolean> {
	return new Promise<boolean>((resolve)=>{resolve(true);});
}

//returns a ParallelBcrypt object
function setup_bcrypt():calcpass2017a.ParallelBcrypt {
	let pbcrypt = new calcpass2017a.ParallelBcrypt();
	pbcrypt.execute = execute_parallel_bcrypt_webworkers;
	let lastPercent = 0.0;
	pbcrypt.progressCallback = (percent:number) => {
		if ((percent - lastPercent) >= 0.25 || percent == 1.0) {
			lastPercent = percent;
			console.log('  ' + Math.floor(percent * 100.0) + '%');
		}
	};

	return pbcrypt;
}

async function Test_StretchMasterPassword():Promise<boolean> {
	let pass = stringToUTF8('Hello World');
	console.log('  stretching...');
	let sm = await calcpass2017a.StretchMasterPassword(pass, 'a@b.c', setup_bcrypt());

	assert.equal(hex.encode(sm.bytes), "f60f7cd075e3242879d04f3f10546f2cd5c2c1ab7790d466f9bca47864dfcce0");

	return emptyPromise();
}



function Test_MakeSiteKey() {
	let stretchedMaster = new calcpass2017a.StretchedMaster();
	stretchedMaster.bytes = byteSeq(1, 32);

	let sitekey = calcpass2017a.MakeSiteKey(stretchedMaster, " \t\nExAmPle.CoM \r", 0);

	assert.equal(hex.encode(sitekey.bytes), "6c95536db40ee491011c5159a5990e39a5ff09dae396559fe7b2413c4308bc62");
}

function Test_MixSiteAndCard() {
	let sitekey = new calcpass2017a.SiteKey();
	sitekey.bytes = byteSeq(1, 32);

	let mixed = calcpass2017a.MixSiteAndCard(sitekey, " \n\tQwErTyUi \r\t");

	assert.equal(hex.encode(mixed.bytes), "6e8c0b5448f31396a04b1139b0ec43308e55192340610a564107bfde8dccc8dc");
}

async function Test_StretchSiteCardMix():Promise<boolean> {
	let mixed = new calcpass2017a.SiteCardMix();
	mixed.bytes = byteSeq(1, 32);

	console.log('  stretching...');
	let pwseed = await calcpass2017a.StretchSiteCardMix(mixed, setup_bcrypt());
	assert.equal(hex.encode(pwseed.bytes),
		"0fb2c41f1a71834186bc515889f881d892efcd248eabf88ff68abfa7afdc6df7");

	return emptyPromise();
}

function Test_MakeFriendlyPassword12a() {
	let seed = new calcpass2017a.PasswordSeed();
	seed.bytes = byteSeq(1, 32);

	assert.equal(calcpass2017a.MakeFriendlyPassword12a(seed), 'Scvqduejxmm5');

	//change seed
	seed.bytes[31]++;
	assert.equal(calcpass2017a.MakeFriendlyPassword12a(seed), 'Ikvruuyldov1');

	//checksum of 20 different seeds (verified against Go program)
	seed.bytes = byteSeq(1, 32);
	let sha = new sha256.Hash();
	let pass:string;
	let j = 0;
	for (let i = 0; i < 20; i++) {
		//modify seed
		seed.bytes[j % 32]++;
		j++;
		
		pass = calcpass2017a.MakeFriendlyPassword12a(seed);
		sha.update(stringToUTF8(pass));
	}

	assert.equal(hex.encode(sha.digest()), '008634126acab8fdd6c34f123495a8d2d3ae9cd073e705cd12d506d71e63234a');
}

function Test_MakeSiteCoordinates() {
	let sitekey = new calcpass2017a.SiteKey();
	sitekey.bytes = byteSeq(1, 32);

	let coords = calcpass2017a.MakeSiteCoordinates(sitekey, 2);
	assert.equal(coords.length, 2);
	assert.equal(coords[0].toString(), "13A");
	assert.equal(coords[1].toString(), "8M");

	//change key
	sitekey.bytes[31]++;
	coords = calcpass2017a.MakeSiteCoordinates(sitekey, 2);
	assert.equal(coords.length, 2);
	assert.equal(coords[0].toString(), "8S");
	assert.equal(coords[1].toString(), "13E");
}

export async function calcpass2017a_test():Promise<boolean> {
	assert.isTrue(calcpass2017a.isSaneEmail('a@b.c'));

	Test_MakeSiteKey();
	Test_MixSiteAndCard();
	Test_MakeFriendlyPassword12a();
	Test_MakeSiteCoordinates();

	await Test_StretchMasterPassword();
	await Test_StretchSiteCardMix();

	return emptyPromise();
}
