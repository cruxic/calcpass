package com.calcpass.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
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
}
