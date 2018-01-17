package com.calcpass.droidapp;


import android.content.Context;
import android.content.SharedPreferences;

import com.calcpass.util.Util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

/**
 * Persistent key/value store for this app.
 * */
public class DataStore {
    private SharedPreferences sp;

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
        Set<String> temp = sp.getStringSet("SEED_NAMES", null);

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
	 * @param seedRawBytes the 128bit seed which will be used to compute a MAC for the stored data
	 * */
    public void setSeedMetaData(SeedMetaData smd, byte[] seedRawBytes) {
    	here: verify not already exists?

        String json = smd.serializeToJson();

        //Create MAC to prevent tampering
        byte[] json_mac = Util.hmacSha256(seedRawBytes, Util.encodeUTF8(json));

		String propKey = "SeedMetaData_" + smd.properties.name;
		String macPropKey = "MAC_" + propKey;

		SharedPreferences.Editor edit = sp.edit();
		edit.putString(propKey, json);
		edit.putString(macPropKey, Util.hexEncode(json_mac));
		here: also update SEED_NAMES
		boolean ok = edit.commit();  //commit instead of apply for synchronous
		if (!ok)
			throw new RuntimeException("setSeedMetaData: commit failed");
    }

    public SeedMetaData getSeedMetaData(String seedName) {

    }

}
