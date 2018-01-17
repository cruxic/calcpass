package com.calcpass;

/**
 * Algorithm used to calculate the password from the seed.
 */
public enum AlgorithmType {
	Alg2018a(1);

	public final int intValue;

	AlgorithmType(int intVal) {
		this.intValue = intVal;
	}

	/**
	 * Create a KDFType given the integer value.
	 * returns null if KDFType is unknown.
	 * */
	public static AlgorithmType fromIntValue(int v) {
		for (AlgorithmType t: values()) {
			if (t.intValue == v)
				return t;
		}

		return null;
	}

	public byte asByte() {
		return (byte)intValue;
	}

}
