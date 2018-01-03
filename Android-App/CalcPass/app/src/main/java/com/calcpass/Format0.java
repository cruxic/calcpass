package com.calcpass;

import com.calcpass.util.Util;

import java.io.UnsupportedEncodingException;

/**
 Import encrypted seed in format version zero.  The binary format is:

 <pre>
 Format 0:

	 0    : FormatVer 0x00
	 1    : encryptionKDFType
	 2-9  : KDF-Salt
	 --- Encrypted
	 10-25: seed.Bytes (16 bytes)
	 26   : seed.DefaultPasswordFormat
	 27   : seed.HighValueKDFType
	 --- End Encrypted
	 28-N : Seed Name (Not included in printed bytewords)
	 N+1-N+4: Inner MAC (HmacSha256 of all the above before encryption truncated to 4 bytes)
	 N+5-N+6: Outer Checksum (sha256 truncated to 2 bytes)
 </pre>
*/
class Format0 {
	/*
	bcrypt requires 128bits of salt.  I will compromise because
	users sometimes type it by hand when importing their printed seed.

	Instead I'll use 64bits of random salt, (which is sufficient according
	to RFC-2898), but I'll further add the seed name, which is usually a
	word or a person's name.  I'll also add in some constant "data that explicitly
	distinguishes between different operations" as suggested by RFC-2898.

	All this gets hashed to expand it to 128bits.
	*/
	private static byte[] expandSalt(byte[] seedName, byte[] rand64bit) {
		if (seedName.length == 0 || rand64bit.length != 8) {
			throw new IllegalArgumentException("bad expandSalt arg");
		}

		byte[] operation = Util.encodeUTF8("calcpass-printed-seed");
		byte[] hash = Util.sha256(Util.concatAll(seedName, rand64bit, operation));

		//truncate to 128bits
		return Util.slice(hash, 0, 16);
	}

	/**
	 * @param decryptionPassword pass null to only verify basic data integrity and return only the seed name.
	 * */
	static ImportResult ImportRaw(byte[] dat, String decryptionPassword)
			throws ImportEx
	{
		int d = dat.length;
		if (d <= 29) {
			throw new ImportEx("Data too short for format 0");
		}

		if (dat[0] != 0x00) {
			throw new ImportEx("Not format 0.");
		}

		//verify outer checksum
		byte[] chk1 = Util.slice(Util.sha256(Util.slice(dat, 0, d-2)), 0, 2);
		byte[] chk2 = Util.slice(dat, d-2, d);
		if (!Util.constantTimeCompare(chk1, chk2)) {
			throw new ImportEx("Checksum fail.  Typo?");
		}

		//Seed name
		byte[] rawSeedName = Util.slice(dat, 28, d-6);
		String seedName = null;
		try {
			seedName = new String(rawSeedName, "UTF-8");
		} catch (UnsupportedEncodingException e) {
			//should never happen
			throw new RuntimeException(e);
		}

		//Expand the salt
		byte[] salt64 = Util.slice(dat, 2, 10);
		byte[] salt128 = expandSalt(rawSeedName, salt64);

		//Determine KDF type
		int v = dat[1] & 0xFF;
		KDFType encryptionKDFType = KDFType.fromIntValue(v);
		if (encryptionKDFType == null)
			throw new ImportEx("Unsupported KDF type " + v);

		ImportResult res = new ImportResult();
		res.seedName = seedName;
		res.encryptionKDF = encryptionKDFType;
		res.formatVer = 0;

		//Data is intact. Stop here if no decryption password was provided.
		if (decryptionPassword == null)
			return res;

		//Derive decryption key
		byte[] key = KeyDerivation.ExecKDF(encryptionKDFType, decryptionPassword, salt128);

		//XOR decrypt
		for (int i = 10; i < 28; i++) {
			dat[i] ^= key[i-10];
		}

		//Verify inner MAC
		chk1 = Util.slice(dat, d-6, d-2);
		chk2 = Util.slice(Util.hmacSha256(key, Util.slice(dat,0,d-6)), 0, 4);
		if (!Util.constantTimeCompare(chk1, chk2)) {
			throw new ImportEx("Decryption failed.  Wrong password or corrupt data.");
		}

		Seed seed = new Seed();
		seed.name = seedName;

		//default password format
		v = dat[26] & 0xFF;
		seed.DefaultPasswordFormat = PassFmt.fromInvVal(v);
		if (seed.DefaultPasswordFormat == null)
			throw new ImportEx("Unsupported password format " + v);

		//high value KDF type
		v = dat[27] & 0xFF;
		seed.HighValueKDFType = KDFType.fromIntValue(v);
		if (seed.HighValueKDFType == null)
			throw new ImportEx("Unsupported KDF type " + v);

		seed.bytes = Util.slice(dat, 10, 26);

		res.seed = seed;
		return res;
	}

}
