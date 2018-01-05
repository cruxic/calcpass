package com.calcpass;

/**
 * Supported password output formats.
 */
public enum PassFmt {
	Friendly9(9),
	Friendly12(12);

	public final int intValue;

	PassFmt(int intVal) {
		this.intValue = intVal;
	}

	public static PassFmt fromInvVal(int v) {
		for (PassFmt pf: values()) {
			if (pf.intValue == v)
				return pf;
		}

		return null;
	}

	public byte asByte() {
		return (byte)intValue;
	}


}
