package com.calcpass.droidapp;

import com.calcpass.AlgorithmType;
import com.calcpass.PassFmt;
import com.calcpass.Seed;
import com.calcpass.util.Util;
import com.grack.nanojson.JsonObject;
import com.grack.nanojson.JsonParser;
import com.grack.nanojson.JsonParserException;
import com.grack.nanojson.JsonStringWriter;
import com.grack.nanojson.JsonWriter;

import java.io.IOException;

/**
 * Properties of a seed which has been installed.  The actual bytes of the seed are not
 * available - those live in the Android Keystore.
 */
public class SeedMetaData extends Seed {

	/**
	 * Milliseconds since the epoch, UTC.
	 * */
	public long dateAdded;

	public SeedMetaData(Seed seed) {
		//Deep copy all properties except the key
		this.name = seed.name;
		this.algorithm = seed.algorithm;
		this.DefaultPasswordFormat = seed.DefaultPasswordFormat;
	}

	public SeedMetaData() {

	}

	/*
	public void verifyAll(KeyStoreOperations keystore) throws KeyStoreOperationEx {
		String keyID = name;

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

*/

	public String toJson() {
		JsonStringWriter obj = JsonWriter.string().object();

		obj.value("Name", name);
		obj.value("DefaultPasswordFormat", DefaultPasswordFormat.intValue);
		obj.value("Algorithm", algorithm.intValue);
		obj.value("DateAdded", dateAdded);

		obj.end();
		return obj.done();
	}

	public static SeedMetaData fromJSON(String jsonText) throws DataStoreEx {
		SeedMetaData smd = new SeedMetaData();

		JsonObject obj = null;
		try {
			obj = JsonParser.object().from(jsonText);
		} catch (JsonParserException e) {
			throw new DataStoreEx("Invalid JSON in seed meta-data");
		}

		//Name
		smd.name = obj.getString("Name");
		if (smd.name == null)
			throw new DataStoreEx("Missing \"Name\"");

		//Algorithm
		int v = obj.getInt("Algorithm", -1);
		if (v == -1)
			throw new DataStoreEx("Missing \"Algorithm\"");
		smd.algorithm = AlgorithmType.fromIntValue(v);
		if (smd.algorithm == null)
			throw new DataStoreEx("Unsupported AlgorithmType " + v);

		//DefaultPasswordFormat
		v = obj.getInt("DefaultPasswordFormat", -1);
		if (v == -1)
			throw new DataStoreEx("Missing \"DefaultPasswordFormat\"");
		smd.DefaultPasswordFormat = PassFmt.fromInvVal(v);
		if (smd.DefaultPasswordFormat == null)
			throw new DataStoreEx("Unsupported PassFmt " + v);

		//DateAdded
		double d = obj.getDouble("DateAdded", -1.0);
		if (d < 0.0)
			throw new DataStoreEx("Missing \"DateAdded\"");
		smd.dateAdded = (long)d;

		return smd;
	}
}
