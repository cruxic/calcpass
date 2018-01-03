package com.calcpass.util;

import android.util.Base64;

/**
 * A standard Base64 decoder that returns null if an illegal character is encountered.  Padding is optional.
 *
 * If you're compiling outside of Android you'll need to replace this class with an equivalent.
 */
public interface StrictBase64Decoder {
	byte[] decodeBase64Strict(String text);
}
