package com.calcpass.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.io.UnsupportedEncodingException;
import java.security.*;


public class Util {

	public static String hexEncode(byte[] data) {
		char[] chars = new char[data.length * 2];

		final String alphabet = "0123456789abcdef";
		int b;

		int j = 0;
		
		for (int i = 0; i < data.length; i++) {
			b = data[i] & 0xFF;
			//high nibble
			chars[j++] = alphabet.charAt(b >> 4);
			//low nibble
			chars[j++] = alphabet.charAt(b & 0x0F);
		}

		return new String(chars);
	}

	private static int hexCharToNibble(char c) {
		if (c >= '0' && c <= '9')
			return (int)(c - '0');
		else if (c >= 'a' && c <= 'f')
			return ((int)(c - 'a')) + 10;
		else if (c >= 'A' && c <= 'F')
			return ((int)(c - 'A')) + 10;
		else
			throw new IllegalArgumentException("\'" + c + "\' is not a valid hex character.");
	}

	/**
	Convert a hex string to bytes.  Case insensitive.
	*/
	public static byte[] hexDecode(String hex) {
		int slen = hex.length();
		if (slen % 2 != 0)
			throw new IllegalArgumentException("Odd number of characters in hex string.");

		byte[] res = new byte[slen / 2];
		
		int i = 0;
		int j = 0;
		
		int b;
		while (i < slen) {
			//high nibble
			b = hexCharToNibble(hex.charAt(i++)) << 4;
			//low nibble
			b |= hexCharToNibble(hex.charAt(i++));

			res[j++] = (byte)b;
		}

		return res;		
	}

	/**
		Compute SHA256 hash of given data.
		Always returns 32 bytes.
	*/
	public static byte[] sha256(byte[] data) {
		MessageDigest md;
		try {
			md = MessageDigest.getInstance("SHA-256");
		}
		catch (NoSuchAlgorithmException nsae) {
			throw new RuntimeException(nsae);
		}
		
		return md.digest(data);
	}

	/**
		Compute HMAC SHA256 of given message using given key.
		Always returns 32 bytes.
	*/
	public static byte[] hmacSha256(byte[] key, byte[] message) {
		if (key.length == 0)
			throw new IllegalArgumentException("empty key");

		Mac m;
		SecretKeySpec sks;
		try {
			m = Mac.getInstance("HmacSHA256");
			sks = new SecretKeySpec(key, "HmacSHA256");
			m.init(sks);
		}
		catch (NoSuchAlgorithmException nsae) {
			throw new RuntimeException(nsae);
		}
		catch (InvalidKeyException ike) {
			throw new RuntimeException(ike);
		}
		
        
        
        return m.doFinal(message);
	}

	/**
	 * Determine if the given text appears to be valid Base64.  Padding is optional.
	 * @return the index of the first invalid character or -1 if all are valid.
	 * */
	public static int isValidBase64(String b64) {
		final String ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/";
		int slen = b64.length();

		//Ignore trailing '='
		while (slen > 0 && b64.charAt(slen -1) == '=')
			slen--;

		//Abort if any char is not in ALPHABET
		for (int i = 0; i < slen; i++) {
			char c = b64.charAt(i);
			if (ALPHABET.indexOf(c) == -1) {
				return i;
			}
		}

		//All valid!
		return -1;
	}

	/**Compare two byte arrays for equality in constant time to avoid timing attacks.*/
	public static boolean constantTimeCompare(byte[] a, byte[] b) {
		//"A Lesson In Timing Attacks"
		//https://codahale.com/a-lesson-in-timing-attacks/
		if (a.length != b.length) {
			return false;
		}

		int result = 0;
		for (int i = 0; i < a.length; i++) {
			result |= a[i] ^ b[i];
		}

		return result == 0;
	}

	/**
	 * Copy a sub-region of the given byte array.
	 * End offset is exclusive.
	 * */
	public static byte[] slice(byte[] data, int start, int end) {
		if (end < start)
			throw new ArrayIndexOutOfBoundsException("end before start!");

		byte[] res = new byte[end - start];
		System.arraycopy(data, start, res, 0, res.length);
		return res;
	}

	/**Concatenate 2 byte arrays*/
	public static byte[] concat(byte[] a, byte[] b) {
		byte[] res = new byte[a.length + b.length];
		System.arraycopy(a, 0, res, 0, a.length);
		System.arraycopy(b, 0, res, a.length, b.length);
		return res;
	}

	/**Concat many byte arrays.*/
	public static byte[] concatAll(byte[]... arrays) {
		int totalLen = 0;
		for (byte[] b: arrays)
			totalLen += b.length;

		byte[] res = new byte[totalLen];

		int j = 0;
		for (byte[] b: arrays) {
			System.arraycopy(b, 0, res, j, b.length);
			j += b.length;
		}

		return res;
	}

	/**
	 * Convert string to UTF-8 bytes without try/catch.
	 * */
	public static byte[] encodeUTF8(String text) {
		try {
			return text.getBytes("UTF-8");
		} catch (UnsupportedEncodingException e) {
			//very unlikely on any modern JVM
			throw new UnsupportedOperationException("UTF-8 not supported!");
		}
	}

}
