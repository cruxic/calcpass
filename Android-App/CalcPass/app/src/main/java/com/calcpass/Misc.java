package com.calcpass;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;

public class Misc {


	/**
	 * Determine if the given text appears to be a valid domain name and return each component in a list.
	 * For example "foo.bar.com" returns ["foo", "bar", "com"].
	 *
	 * Returns null if the given text is not a valid domain name.
	 * Unicode is allowed but code-points below U+007E ('~') must be A-Z, a-z, 0-9 or dash.
	 * For example, if the text contains ' ' or ':' or '_' its not valid.
	 *
	 * Additionally there must be at least 1 character between each dot and the last component must have
	 * at least 2 characters.  Also the last component cannot begin with a digit because this distinguishes
	 * an IPv4 address from a domain name (RFC 1738, "The rightmost domain label will never start with a digit...")
	 * */
	public static String[] parseDomainName(String text) {
		int slen = text.length();
		char c;

		//Count dots
		int j = 0;
		for (int i = 0; i < slen; i++) {
			c = text.charAt(i);
			if (c == '.')
				j++;
		}

		//Must have at least 1 dot
		if (j == 0)
			return null;

		String[] components = new String[j+1];

		boolean ok;
		int compStartIndex = 0;
		j = 0;
		for (int i = 0; i <= slen; i++) {
			if (i == slen)
				c = '.';  //forces flush
			else
				c = text.charAt(i);

			if (c == '.') {
				//cannot have empty component
				if (i - compStartIndex <= 0)
					return null;

				components[j++] = text.substring(compStartIndex, i);
				compStartIndex = i+1;
			}
			else if (c < '~') {
				//characters in the ASCII range must be A-Z, a-z, 0-9 or dash
				ok = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-';
				if (!ok)
					return null;
			}
			//else accept any Unicode character
		}

		//Last must have at least 2 chars
		//c >= '0' && c <= '9'
		String last = components[components.length - 1];
		if (last.length() < 2)
			return null;
		else {
			//RFC 1738: "The rightmost domain label will never start with a digit..."
			c = last.charAt(0);
			if (c >= '0' && c <= '9')
				return null;
		}

		return components;
	}

	/**
	 * Convert ["foo", "bar", "com"] to ["bar.com", "foo.bar.com"]
	 * */
	public static String[] domainOptions(String[] parts) {
		String[] res = new String[parts.length - 1];

		StringBuilder sb = new StringBuilder(64);

		int k = 0;
		int j = parts.length - 2;
		while (j >= 0) {
			sb.setLength(0);
			for (int i = j; i < parts.length; i++) {
				if (i != j)
					sb.append('.');

				sb.append(parts[i]);
			}

			j--;
			res[k++] = sb.toString();
		}

		return res;
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
