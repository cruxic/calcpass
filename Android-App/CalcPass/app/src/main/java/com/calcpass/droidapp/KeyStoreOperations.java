package com.calcpass.droidapp;

import java.security.KeyStore;
import java.security.KeyStoreException;

import android.app.Activity;
import android.content.res.Resources;
import android.security.keystore.KeyInfo;
import android.security.keystore.KeyProperties;
import android.security.keystore.KeyProtection;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.SecretKeySpec;

import android.app.KeyguardManager;
import android.content.Intent;

import com.calcpass.util.Util;


/**
 * Abstract operations against the android hardware backed KeyStore
 */
public class KeyStoreOperations {
    private final KeyStore androidKeyStore;

    public static final int UNLOCK_REQUEST_CODE = 0x4242;  //arbitrary

    public static final String TEST_KEY_ID = "__CalcPassTestKeyID__";

    /**An arbitrary 32 byte (256bit) string*/
    public static final String TEST_MESSAGE = "505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f";
    private static final String TEST_KEY = "a0a1a2a3a4a5a6a7a8a9aaabacadaeaf";
    private static final String TEST_EXPECTED_HMAC = "b0284a5aac73958ff35aba283491aee72d800e71344a4ef93e9d433ad99f992a";


    private static final String HMAC_ALG = "HmacSHA256";

    /**How long keys remain unlocked after user authorizes an action*/
    private static final int DEFAULT_UserAuthenticationValidityDurationSeconds = 5;

    /**For I18N strings*/
    private Resources res;

    public KeyStoreOperations(Resources stringResources) throws KeyStoreOperationEx {
    	res = stringResources;

        try {
            androidKeyStore = KeyStore.getInstance("AndroidKeyStore");
            androidKeyStore.load(null);
        } catch (Exception e) {
            throw new KeyStoreOperationEx(e);
        }
	}

	public void installHmacSha256Key(String keyID, byte[] keyBytes) throws KeyStoreOperationEx {
		//https://developer.android.com/reference/android/security/keystore/KeyProtection.html

		SecretKeySpec sks = new SecretKeySpec(keyBytes, HMAC_ALG);

		KeyProtection.Builder builder = new KeyProtection.Builder(KeyProperties.PURPOSE_SIGN);

		//"Sets whether this key is authorized to be used only if the user has been authenticated."
		builder.setUserAuthenticationRequired(true);

		//"Sets the duration of time (seconds) for which this key is authorized to be used after the user is successfully authenticated."
		builder.setUserAuthenticationValidityDurationSeconds(DEFAULT_UserAuthenticationValidityDurationSeconds);

		try {
			androidKeyStore.setEntry(
					keyID,
					new KeyStore.SecretKeyEntry(sks),
					builder.build());
		} catch (KeyStoreException e) {
			throw new KeyStoreOperationEx(e);
		}
	}

	public void requestKeyUnlock(String keyID, Activity currentActivity) throws KeyStoreOperationEx {
		KeyguardManager kgm = currentActivity.getApplicationContext().getSystemService(KeyguardManager.class);

		if (kgm == null)
			throw new KeyStoreOperationEx("Unable to get KeyguardManager service");

		String seedName = keyID;

		//Show a less funky name to the test key
		if (keyID.equals(TEST_KEY_ID))
			seedName = "Test Key";

		String title = res.getString(R.string.KeyStore_unlockTitle);
		String desc = res.getString(R.string.KeyStore_unlockDescription, seedName);

		Intent intent = kgm.createConfirmDeviceCredentialIntent(title, desc);


		currentActivity.startActivityForResult(intent, UNLOCK_REQUEST_CODE);

		//The activity's onActivityResult() will be called next
	}

	public boolean doesKeyExist(String keyID) throws KeyStoreOperationEx {
		try {
			return androidKeyStore.getKey(keyID, null) != null;
		} catch (Exception e) {
			throw new KeyStoreOperationEx(e);
		}
	}

	/**
	 * Ask the Android Keystore to calculate HMAC-SHA256 with a previously installed key.
	 * Key must already be unlocked via {@link #requestKeyUnlock}
	 * */
	public byte[] hmacSha256(String keyID, byte[] message) throws KeyStoreOperationEx {
		SecretKey keyRef;
		try {
			//Get a reference to the key
			keyRef = (SecretKey) androidKeyStore.getKey(keyID, null);
		} catch (Exception e) {
			throw new KeyStoreOperationEx(e);
		}

		if (keyRef == null) {
			String msg = res.getString(R.string.KeyStore_keyIDNotExist, keyID);
			throw new KeyStoreOperationEx(msg);
		}

		try {
			Mac mac = Mac.getInstance(HMAC_ALG);
			mac.init(keyRef);

			return mac.doFinal(message);
		} catch (Exception e) {
			throw new KeyStoreOperationEx(e);
		}
	}

	/**
	 * Get detailed info about the specified key.  Returns null if the key does not exist.
	 * */
	public KeyInfo getKeyInfo(String keyID) throws KeyStoreOperationEx {
		SecretKey keyRef;
		try {
			//Get a reference to the key
			keyRef = (SecretKey) androidKeyStore.getKey(keyID, null);
		} catch (Exception e) {
			throw new KeyStoreOperationEx(e);
		}

		if (keyRef == null)
			return null;

		try {
			SecretKeyFactory factory = SecretKeyFactory.getInstance(keyRef.getAlgorithm(), "AndroidKeyStore");
			return (KeyInfo) factory.getKeySpec(keyRef, KeyInfo.class);
		}
		catch (Exception ex) {
			throw new KeyStoreOperationEx(ex);
		}
	}

	public void installTestKey() throws KeyStoreOperationEx {
		byte[] testKey = Util.hexDecode(TEST_KEY);
		installHmacSha256Key(TEST_KEY_ID, testKey);
	}

	public void verifyTestKey() throws KeyStoreOperationEx {
		byte[] msg = Util.hexDecode(TEST_MESSAGE);
		byte[] got = hmacSha256(TEST_KEY_ID, msg);
		String gotStr = Util.hexEncode(got);
		System.out.println(gotStr);
		if (!gotStr.equals(TEST_EXPECTED_HMAC)) {
			throw new KeyStoreOperationEx("Test failed: wrong HMAC-SHA256!");
		}
	}

}
