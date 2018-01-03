package com.calcpass.util;

public abstract class Base64Implementation {
	/**
	 * The thread-safe global instance.  You must assign this during application startup.
	 * */
	public static Base64Implementation instance;

	/**
	 * Decoded base64 or return null if an illegal character is encountered.  Padding is optional.
	 * */
	public abstract byte[] decodeBase64Strict(String text);

}
