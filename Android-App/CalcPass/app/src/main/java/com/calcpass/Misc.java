package com.calcpass;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;

public class Misc {

	/**
	 * Split a domain name such as "foo.bar.com" into ["foo", "bar", "com"].
	 *
	 * This function should only be passed the "host" portion of a URL, not the full URL.  The
	 *
	 * If the rightmost part of the domain name starts with a digit then it is assumed that the given hostname
	 * is an IPv4 address and it will not be split
	 * (RFC 1738, "The rightmost domain label will never start with a digit...")
	 */
	public static String[] splitDomainName(String hostname) {
		String[] parts = hostname.split("\\.");

		String lastPart = parts[parts.length - 1];
		if (lastPart.length() > 0) {
			char c = lastPart.charAt(0);
			if (c >= '0' && c <= '9')
				parts = new String[]{hostname};
		}

		return parts;
	}


	/**
	 * For the given domain name, strip off each successive sub-domain.  For example
	 * removed.  For example: "a.b.c.d" would return
	 * ["a.b.c.d", "b.c.d", "c.d"]
	 * */
	public List<String> getDomainScopes(String host) {
		here: test isDomain() and implement this

	}

	/**
	 * Determine if the given text appears to be a valid domain name.
	 * Unicode is allowed but code-points below U+007E ('~') must be A-Z, a-z, 0-9 or dash.
	 * For example, if the text contains ' ' or ':' or '_' it will not be considered a valid domain name.
	 *
	 * Additionally there must be at least 1 character between each dot and the last component must have
	 * at least 2 characters.
	 * */
	public boolean isDomainName(String text) {
		int slen = text.length();
		char c;
		boolean ok;
		int compLen = 0;
		int numComponents = 0;
		for (int i = 0; i < slen; i++) {
			c = text.charAt(i);

			if (c == '.') {
				//cannot have empty component
				if (compLen == 0)
					return false;

				compLen = 0;
				numComponents++;
			}

			if (c < '~') {
				//characters in the ASCII range must be A-Z, a-z, 0-9 or dash
				ok = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-';
				if (!ok)
					return false;
			}
			//else accept any Unicode character

			compLen++;
		}

		//Must have at least two components and the last must be at least 2 chars long
		return numComponents > 1 && compLen >= 2;
	}


	/**
	 * Attempt to parse the scheme, hostname and port number from the given URL.
	 * Returns an array of 2 elements (eg ["https", "example.com:8080"]).
	 * Returns null if the URL is invalid.
	 * */
	public static String[] getURLSchemeAndHost(String url) {
		try {
			URL u = new URL(url);

			//Have a non-empty scheme?
			String scheme = u.getProtocol();
			if (scheme != null && scheme.length() > 0) {
				//Have non-empty host?
				String host = u.getHost();
				if (host != null && host.length() > 0) {
					//Port is optional
					int port = u.getPort();
					if (port >= 0) {
						host += ":" + port;
					}

					//Success
					return new String[]{scheme, host};
				}
			}
		} catch (MalformedURLException e) {
			//will return null
		}

		return null;
	}
}
