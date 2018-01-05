package com.calcpass.droidapp;

/**
 * A problem talking to the Android Keystore
 */
public class KeyStoreOperationEx extends Exception {
	private String msg;

	public KeyStoreOperationEx(Exception cause) {
		super(cause);

	}

	public KeyStoreOperationEx(String message) {
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
