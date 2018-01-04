package com.calcpass.droidapp;

/**
 * A problem talking to the Android Keystore
 */
public class CalcpassKeystoreEx extends Exception {
	private String msg;

	public CalcpassKeystoreEx(Exception cause) {
		super(cause);

	}

	public CalcpassKeystoreEx(String message) {
		msg = message;
	}

	@Override
	public String getMessage() {
		if (msg != null)
			return msg;

		Throwable cause = getCause();
		if (cause != null)
			return cause.toString();
		else
			return getClass().getSimpleName();
	}

}
