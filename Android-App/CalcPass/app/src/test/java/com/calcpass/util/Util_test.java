package com.calcpass.util;

import static org.junit.Assert.*;
import org.junit.Test;

public class Util_test {
	public Util_test() {
		Base64Implementation.instance = new Java8Base64Implementation();
	}


	@Test
	public void test_hexEncodeAndDecode() {
		//All possible byte values
		byte[] seq = new byte[256];
		for (int i = 0; i < 256; i++)
			seq[i] = (byte)i;

		String expect = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff";
		assertEquals(expect, Util.hexEncode(seq));

		//zero bytes
		assertEquals("", Util.hexEncode(new byte[0]));

		//
		// Decode
		//

		//lower case
		byte[] seq2 = Util.hexDecode(expect);
		assertArrayEquals(seq, seq2);

		//upper case
		seq2 = Util.hexDecode(expect.toUpperCase());
		assertArrayEquals(seq, seq2);
		
		assertArrayEquals(new byte[0], Util.hexDecode(""));
		
	}

	@Test
	public void test_sha256() throws Exception {
		byte[] res = Util.sha256("Hello World!\n".getBytes("UTF-8"));
		assertEquals("03ba204e50d126e4674c005e04d82e84c21366780af1f43bd54a37816b6ab340", Util.hexEncode(res));
	}
	

	@Test
	public void test_hmacSha256() throws Exception {
		byte[] res = Util.hmacSha256("SuperSecretPassword".getBytes("UTF-8"), "Hello World!".getBytes("UTF-8"));
		assertEquals("ea6c66229109f1321b0088c42111069e9794c3aed574e837b6e87c6d14931aef", Util.hexEncode(res));
	}

	@Test
	public void test_decodeBase64Strict() {
		byte[] expect = new byte[256];
		for (int i = 0; i < 256; i++)
			expect[i] = (byte)i;

		//0-255
		String input = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==";
		byte[] got = Base64Implementation.instance.decodeBase64Strict(input);
		assertArrayEquals(expect, got);

		//All possible chars
		expect = Util.hexDecode("69b71d79f8218a39259a7a29aabb2dbafc31cb300108310518720928b30d38f411493515597619d35db7e39ebbf3dfbf");
		input = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/";
		got = Base64Implementation.instance.decodeBase64Strict(input);
		assertArrayEquals(expect, got);

		got = Base64Implementation.instance.decodeBase64Strict("YQ==");
		assertArrayEquals(new byte[]{97}, got);

		//Illegal char
		got = Base64Implementation.instance.decodeBase64Strict("Y-Q==");
		assertNull(got);

		//Illegal char after equal
		got = Base64Implementation.instance.decodeBase64Strict("YQ==a");
		assertNull(got);
	}

	@Test
	public void ConstantTimeCompare() {
		assertTrue(Util.constantTimeCompare(new byte[]{1,2,3}, new byte[]{1,2,3}));
		assertTrue(Util.constantTimeCompare(new byte[0], new byte[0]));
		assertTrue(Util.constantTimeCompare(new byte[1], new byte[1]));

		assertFalse(Util.constantTimeCompare(new byte[]{1,2,3}, new byte[]{1,2,4}));
		assertFalse(Util.constantTimeCompare(new byte[]{1,2,3}, new byte[]{1,2,3,4}));
		assertFalse(Util.constantTimeCompare(new byte[]{1,2,3,4}, new byte[]{1,2,3}));
		assertFalse(Util.constantTimeCompare(new byte[]{(byte)0x83}, new byte[]{(byte)0x84}));
	}

	@Test
	public void byte_slice() {
		byte[] dat1 = new byte[]{8,7,6,5,4,3,2,1};

		byte[] got = Util.slice(dat1, 0, dat1.length);
		assertArrayEquals(new byte[]{8,7,6,5,4,3,2,1}, got);

		got = Util.slice(dat1, 1, dat1.length -1);
		assertArrayEquals(new byte[]{7,6,5,4,3,2}, got);

		got = Util.slice(dat1, 2, 4);
		assertArrayEquals(new byte[]{6,5}, got);

		got = Util.slice(dat1, 2, 3);
		assertArrayEquals(new byte[]{6}, got);

		got = Util.slice(dat1, 2, 2);
		assertArrayEquals(new byte[0], got);
	}

	@Test
	public void byte_concat() {
		byte[] a = new byte[]{8,7,6,5};
		byte[] b = new byte[]{4,3,2,1};

		byte[] got = Util.concat(a, b);
		assertArrayEquals(new byte[]{8,7,6,5,4,3,2,1}, got);

		got = Util.concat(b, a);
		assertArrayEquals(new byte[]{4,3,2,1,8,7,6,5}, got);

		got = Util.concat(a, new byte[0]);
		assertArrayEquals(a, got);
		assertTrue(got != a);  //deep copied

		byte[] c = new byte[]{9,4,5,7};
		got = Util.concatAll(a, b, c);
		assertArrayEquals(new byte[]{8,7,6,5,4,3,2,1,9,4,5,7}, got);
	}

	
}
