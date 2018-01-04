package com.calcpass.droidapp;

import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableKeyException;

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
public class CalcpassKeyStore {
    private final KeyStore androidKeyStore;

    public static final int UNLOCK_REQUEST_CODE = 0x4242;  //arbitrary

    public static final String TEST_KEY_ID = "key4";

    private static final String HMAC_ALG = "HmacSHA256";

    /**How long keys remain unlocked after user authorizes an action*/
    private static final int DEFAULT_UserAuthenticationValidityDurationSeconds = 5;

    /**For I18N strings*/
    private Resources res;

    public CalcpassKeyStore(Resources stringResources) throws CalcpassKeystoreEx {
    	res = stringResources;

        try {
            androidKeyStore = KeyStore.getInstance("AndroidKeyStore");
            androidKeyStore.load(null);
        } catch (Exception e) {
            throw new CalcpassKeystoreEx(e);
        }
	}

	public void installHmacSha256Key(String keyID, byte[] keyBytes) throws CalcpassKeystoreEx {
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
			throw new CalcpassKeystoreEx(e);
		}
	}

	public void requestKeyUnlock(String keyID, Activity currentActivity) throws CalcpassKeystoreEx {
		KeyguardManager kgm = currentActivity.getApplicationContext().getSystemService(KeyguardManager.class);

		if (kgm == null)
			throw new CalcpassKeystoreEx("Unable to get KeyguardManager service");

		String seedName = keyID;

		//Give a less funky name to the test seed
		if (keyID.equals(TEST_KEY_ID))
			seedName = "Test Key";

		String title = res.getString(R.string.CalcpassKeyStore_unlockTitle);
		String desc = res.getString(R.string.CalcpassKeyStore_unlockDescription, seedName);

		Intent intent = kgm.createConfirmDeviceCredentialIntent(title, desc);


		currentActivity.startActivityForResult(intent, UNLOCK_REQUEST_CODE);

		//The activity's onActivityResult() will be called next
	}

	public boolean doesKeyExist(String keyID) throws CalcpassKeystoreEx {
		try {
			return androidKeyStore.getKey(keyID, null) != null;
		} catch (Exception e) {
			throw new CalcpassKeystoreEx(e);
		}
	}

	/**
	 * Ask the Android Keystore to calculate HMAC-SHA256 with a previously installed key.
	 * Key must already be unlocked via {@link #requestKeyUnlock}
	 * */
	public byte[] hmacSha256(String keyID, byte[] message) throws CalcpassKeystoreEx {
		SecretKey keyRef;
		try {
			//Get a reference to the key
			keyRef = (SecretKey) androidKeyStore.getKey(keyID, null);
		} catch (Exception e) {
			throw new CalcpassKeystoreEx(e);
		}

		if (keyRef == null) {
			String msg = res.getString(R.string.CalcpassKeyStore_keyIDNotExist, keyID);
			throw new CalcpassKeystoreEx(msg);
		}

		try {
			Mac mac = Mac.getInstance(HMAC_ALG);
			mac.init(keyRef);

			return mac.doFinal(message);
		} catch (Exception e) {
			throw new CalcpassKeystoreEx(e);
		}
	}

	/**
	 * Verify that the keystore calculates the correct HMAC.
	 * @return true upon success
	 * */
	public boolean verifyHmacSha256Key(String keyID, byte[] keyBytes) throws CalcpassKeystoreEx {
		byte[] message = Util.encodeUTF8("Hello World!");

		byte[] got = hmacSha256(keyID, message);
		byte[] expect = Util.hmacSha256(keyBytes, message);

		return Util.constantTimeCompare(got, expect);
	}

	public byte[] makeTestSeed() {
    	//0xA0 through 0xAF
    	byte[] key = new byte[16];
    	for (int i = 0; i < key.length; i++)
    		key[i] = (byte)(0xA0 + i);
		return key;
	}

}
