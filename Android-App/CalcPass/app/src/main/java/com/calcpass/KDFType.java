package com.calcpass;

/**
 * Supported key derivation functions for converting plaintext passwords to bytes.
 */
public enum KDFType {
	QuadBcrypt12(12),
	QuadBcrypt13(13),
	QuadBcrypt14(14);

	public final int intValue;

	KDFType(int intVal) {
		this.intValue = intVal;
	}

	/**
	 * Create a KDFType given the integer value.
	 * returns null if KDFType is unknown.
	 * */
	public static KDFType fromIntValue(int v) {
		for (KDFType t: values()) {
			if (t.intValue == v)
				return t;
		}

		return null;
	}

}
