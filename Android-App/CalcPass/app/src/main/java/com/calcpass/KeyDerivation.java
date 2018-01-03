package com.calcpass;

import com.calcpass.parallel_bcrypt.ParallelBcrypt;
import com.calcpass.util.KDFProgressListener;
import com.calcpass.util.Util;

/**
 * Derive a cryptographic key from plain text using supported algorithms.
 */
public class KeyDerivation {

	/**
	 * Derive a key using the specified algorithm type.
	 * */
	public static byte[] ExecKDF(KDFType type, String plainText, byte[] salt, KDFProgressListener progressCallback) {
		byte[] utf8Password = Util.encodeUTF8(plainText);

		switch (type) {
			case QuadBcrypt12:
				return ParallelBcrypt.Hash(4, utf8Password, salt, 12, progressCallback);
			case QuadBcrypt13:
				return ParallelBcrypt.Hash(4, utf8Password, salt, 13, progressCallback);
			case QuadBcrypt14:
				return ParallelBcrypt.Hash(4, utf8Password, salt, 14, progressCallback);
			default:
				throw new UnsupportedOperationException("KDFType not supported: " + type.name());
		}
	}
}
