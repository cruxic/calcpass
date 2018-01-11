package com.calcpass.droidapp;

import com.calcpass.Seed;
import com.calcpass.util.Util;
import com.grack.nanojson.JsonStringWriter;
import com.grack.nanojson.JsonWriter;

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

	/**32 bytes used to verify the integrity of the seed key in the keystore.*/
	public byte[] keyVerifierMAC;

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



	/**
	 * Convert all fields to a multiline string.
	 * */
	public String serializeToJson() {
		JsonStringWriter obj = JsonWriter.string().object();

		obj.value("Name", properties.name);
		obj.value("DefaultPasswordFormat", properties.DefaultPasswordFormat.intValue);
		obj.value("HighValueKDFType", properties.HighValueKDFType.intValue);
		obj.value("DateAdded", dateAdded);
		obj.value("KeyVerifierMAC", Util.hexEncode(keyVerifierMAC));

		obj.end();
		return obj.done();
	}
}
