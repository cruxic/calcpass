package com.calcpass;

import static org.junit.Assert.*;
import org.junit.Test;

public class Misc_test {

	@Test
	public void test_getURLSchemeAndHost() {
		String[] res = Misc.getURLSchemeAndHost("http://example.com");
		assertTrue(res != null);
		assertEquals(res[0], "http");
		assertEquals(res[1], "example.com");

		res = Misc.getURLSchemeAndHost("https://foo:123/yada?this=that");
		assertTrue(res != null);
		assertEquals(res[0], "https");
		assertEquals(res[1], "foo:123");

		res = Misc.getURLSchemeAndHost("invalid");
		assertTrue(res == null);

		res = Misc.getURLSchemeAndHost("");
		assertTrue(res == null);

		res = Misc.getURLSchemeAndHost("ftp://X:1");
		assertTrue(res != null);
		assertEquals(res[0], "ftp");
		assertEquals(res[1], "X:1");
	}

	@Test
	public void test_splitDomainName() {
		String[] res = Misc.splitDomainName("");
		assertEquals(res.length, 1);
		assertEquals(res[0], "");

		res = Misc.splitDomainName("A");
		assertEquals(res.length, 1);
		assertEquals(res[0], "A");

		res = Misc.splitDomainName("a.b");
		assertEquals(res.length, 2);
		assertEquals(res[0], "a");
		assertEquals(res[1], "b");

		res = Misc.splitDomainName("foo.bar.yar.com");
		assertEquals(res.length, 4);
		assertEquals(res[0], "foo");
		assertEquals(res[1], "bar");
		assertEquals(res[2], "yar");
		assertEquals(res[3], "com");

		res = Misc.splitDomainName("1.2.3.4");
		assertEquals(res.length, 1);
		assertEquals(res[0], "1.2.3.4");

		//does not split because digit as first char of toplevel domain
		res = Misc.splitDomainName("digit.1com");
		assertEquals(res.length, 1);
		assertEquals(res[0], "digit.1com");

		//test all digits
		for (int i = 0; i < 10; i++) {
			String host = "digit."+i+"com";
			res = Misc.splitDomainName(host);
			assertEquals(res.length, 1);
			assertEquals(res[0], host);
		}


	}
}
