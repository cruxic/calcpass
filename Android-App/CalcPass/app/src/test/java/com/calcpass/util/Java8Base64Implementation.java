package com.calcpass.util;

import java.util.Base64;

public class Java8Base64Implementation extends Base64Implementation {
	@Override
	public byte[] decodeBase64Strict(String text) {

		int res = Util.isValidBase64(text);
		if (res >= 0)
			return null;

		return Base64.getDecoder().decode(text);
	}
}
