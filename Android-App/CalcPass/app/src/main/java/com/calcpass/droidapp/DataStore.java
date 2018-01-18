package com.calcpass.droidapp;


import android.content.Context;
import android.content.SharedPreferences;

import com.calcpass.util.Util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Persistent key/value store for this app.
 * */
public class DataStore {
    private SharedPreferences sp;

    private static final String PROP_SEED_NAMES = "SEED_NAMES";
	private static final String PROP_SeedMetaData = "SeedMetaData_";
	private static final String PROP_MAC = "MAC_";


    public DataStore(Context context) {
        //MODE_PRIVATE
        //   "file can only be accessed by the calling application (or all applications sharing the same user ID)"
        sp = context.getSharedPreferences("DataStore", Context.MODE_PRIVATE);
    }

    public boolean hasAcceptedEULA() {
        return sp.getBoolean("ACCEPTED_EULA", false);
    }

    public void setAcceptedEULA(boolean accepted) {
        sp.edit().putBoolean("ACCEPTED_EULA", accepted).apply();
    }

    /**Get all seeds which are installed in the key store*/
    public List<String> getSeedNames() {
        //getStringSet()
        //  "Note that you must not modify the set instance returned by this call"
        Set<String> temp = sp.getStringSet(PROP_SEED_NAMES, null);

        ArrayList<String> res;

        if (temp != null) {
            res = new ArrayList<>(temp);
            //deterministic order
            Collections.sort(res);
        }
        else
            res = new ArrayList<>(0);

        return res;
    }

    /**
	 * Store meta-data about an installed seed.
	 *
	 * @param seedRawBytes the 128bit seed which will be used to compute a MAC for the stored data
	 * */
    public void setSeedMetaData(SeedMetaData smd, byte[] seedRawBytes) throws DataStoreEx {
        String json = smd.toJson();

        //Create MAC to prevent tampering
        byte[] json_mac = Util.hmacSha256(seedRawBytes, Util.encodeUTF8(json));

		String propKey = PROP_SeedMetaData + smd.name;
		String macPropKey = PROP_MAC + propKey;

		//Add it to the list of seed names.
		//  "Note that you must not modify the set instance returned by this call"
		Set<String> newSeedNames = sp.getStringSet(PROP_SEED_NAMES, null);
		if (newSeedNames == null)
			newSeedNames = new HashSet<String>();
		else
			newSeedNames = new HashSet<String>(newSeedNames);
		newSeedNames.add(smd.name);

		SharedPreferences.Editor edit = sp.edit();
		edit.putString(propKey, json);
		edit.putString(macPropKey, Util.hexEncode(json_mac));
		edit.putStringSet(PROP_SEED_NAMES, newSeedNames);

		//synchronous commit instead of apply()
		boolean ok = edit.commit();
		if (!ok)
			throw new DataStoreEx("setSeedMetaData: commit failed");
    }

    public SeedMetaData getSeedMetaData(String seedName, KeyStoreOperations keystore) throws DataStoreEx, KeyStoreOperationEx {
		String propKey = PROP_SeedMetaData + seedName;
		String macPropKey = PROP_MAC + propKey;

		String json = sp.getString(propKey, "");
		if (json.length() == 0)
			throw new DataStoreEx("Missing " + propKey);

		String macHex = sp.getString(macPropKey, "");
		if (macHex.length() == 0)
			throw new DataStoreEx("Missing " + macPropKey);

		byte[] expectMAC;
		try {
			expectMAC = Util.hexDecode(macHex);
		}
		catch (IllegalArgumentException iax) {
			throw new DataStoreEx("Invalid hex in " + macPropKey);

		}
		byte[] gotMAC = keystore.hmacSha256(seedName, Util.encodeUTF8(json));

		if (!Arrays.equals(expectMAC, gotMAC))
			throw new DataStoreEx("Corrupt meta-data for seed " + seedName);

		return SeedMetaData.fromJSON(json);
    }

}
