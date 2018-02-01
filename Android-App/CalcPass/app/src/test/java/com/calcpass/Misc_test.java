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
	public void test_parseDomainName() {
		String[] res = Misc.parseDomainName("");
		assertNull(res);

		//Missing dot
		assertNull(Misc.parseDomainName("a"));

		//last component must have 2 chars
		assertNull(Misc.parseDomainName("a.b"));

		assertNull(Misc.parseDomainName("1.2.3.4"));
		assertNull(Misc.parseDomainName("192.168.12.34"));

		//illegal space
		assertNull(Misc.parseDomainName("foo bar.com"));
		//illegal underscore
		assertNull(Misc.parseDomainName("foo_bar.com"));
		//illegal colon
		assertNull(Misc.parseDomainName("foobar.com:8080"));
		//illegal slash
		assertNull(Misc.parseDomainName("foobar.com/path"));

		//Valid
		res = Misc.parseDomainName("a.bc");
		assertEquals(res.length, 2);
		assertEquals(res[0], "a");
		assertEquals(res[1], "bc");

		//Dash OK
		res = Misc.parseDomainName("foo-bar.com");
		assertEquals(res.length, 2);
		assertEquals(res[0], "foo-bar");
		assertEquals(res[1], "com");

		//Unicode OK
		res = Misc.parseDomainName("foo\u01CDbar.com");
		assertEquals(res.length, 2);
		assertEquals(res[0], "foo\u01CDbar");
		assertEquals(res[1], "com");

		//All legal ascii characters
		res = Misc.parseDomainName("abcdefghijkl-mnopqrstuvwxyz.ABCDEFGHIJKLMNOPQRSTUVWXYZ.0123456789.io");
		assertEquals(res.length, 4);
		assertEquals(res[0], "abcdefghijkl-mnopqrstuvwxyz");
		assertEquals(res[1], "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
		assertEquals(res[2], "0123456789");
		assertEquals(res[3], "io");

		//many components
		res = Misc.parseDomainName("foo.bar.yar.com");
		assertEquals(res.length, 4);
		assertEquals(res[0], "foo");
		assertEquals(res[1], "bar");
		assertEquals(res[2], "yar");
		assertEquals(res[3], "com");

		//does not split because leading digit in last component
		res = Misc.parseDomainName("digit.1com");
		assertNull(res);

		//test all digits
		for (int i = 0; i < 10; i++) {
			String host = "digit."+i+"com";
			res = Misc.parseDomainName(host);
			assertNull(res);
		}


	}
}
