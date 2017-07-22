

//TODO: unit test this
export function removeSubdomains(hostname:string) {
	//For MOST websites using the top and second-level domain name is the best
	// choice.  For example, the login page of homedepot.com appears to
	// be a load-balanced subdomain like (secure2.homedepot.com).
	// Similarly, newegg.com has their login page on secure.newegg.com.
	//
	// However, using the 2nd level domain is not always the best choice.
	// For  example, universities like oregonstate.edu have
	// many subdomains such as osulibrary.oregonstate.edu.
	// Perhaps future versions should allow the user to choose?


	//No IPv6.  This also filters out port numbers however those are not
	// supposed to make it into this function anyway.
	if (hostname.indexOf(':') == -1) {
		var parts = hostname.split('.');
		if (parts.length > 1) {
			// Don't process IPv4 addresses
			var re = new RegExp('[0-9]+');
			if (!re.test(parts[parts.length-1])) {
				//second-level.top-level
				return parts.slice(parts.length-2).join('.');
			}
		}
	}

	return hostname;
}
