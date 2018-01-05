package com.calcpass.droidapp;

import com.calcpass.Seed;
import com.calcpass.util.Util;

/**
 * Properties of a seed which has been installed.  The actual bytes of the seed are not
 * available - those live in the Android Keystore.
 */
public class InstalledSeed {
	public Seed properties;

	/**
	 * Milliseconds since the epoch, UTC.
	 * */
	public long dateAdded;

	/**256bits.  Used to verify the integrity of the seed key in the keystore.*/
	public byte[] keyVerifierMAC;

	/**256bits.  Used to verify the integrity of the seed properties.*/
	public byte[] propertiesVerifierMAC;

	public byte[] getPropertiesVerifierMessage() {
		byte[] purpose = Util.encodeUTF8("CALCPASS VERIFIER");
		byte[] keyVerifier = keyVerifierMAC;
		byte[] misc = new byte[] {properties.DefaultPasswordFormat.asByte(), properties.HighValueKDFType.asByte()};
		byte[] nameUTF = Util.encodeUTF8(properties.name);
		//TODO: dateAdded

		byte[] all = Util.concatAll(purpose, misc, nameUTF, keyVerifier);

		return Util.sha256(all);
	}

	public void verifyAll(KeyStoreOperations keystore) throws KeyStoreOperationEx {
		String keyID = properties.name;

		//Verify the key bytes
		byte[] got = keystore.hmacSha256(keyID, KeyStoreOperations.getTestMessage());
		if (!Util.constantTimeCompare(got, keyVerifierMAC)) {
			throw new KeyStoreOperationEx("Wrong key data in Keystore!");
		}

		//Verify the key properties
		got = keystore.hmacSha256(keyID, getPropertiesVerifierMessage());
		if (!Util.constantTimeCompare(got, propertiesVerifierMAC)) {
			throw new KeyStoreOperationEx("Key properties corrupted!");
		}

		//All OK :)
	}
}
