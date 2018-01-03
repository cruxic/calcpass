package com.calcpass.droidapp;

import com.calcpass.util.Base64Implementation;
import com.calcpass.util.Util;
import android.util.Base64;

/**
 * Uses android.util.Base64 to implement base64.
 */
public class AndroidBase64Implementation extends Base64Implementation {
	@Override
	public byte[] decodeBase64Strict(String text) {
		int res = Util.isValidBase64(text);
		if (res >= 0)
			return null;

		try {
			return Base64.decode(text, Base64.DEFAULT);
		}
		catch (IllegalArgumentException iae) {
			//incorrect padding
			return null;
		}
	}
}
