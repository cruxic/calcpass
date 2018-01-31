package com.calcpass;

import java.net.MalformedURLException;
import java.net.URL;

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
