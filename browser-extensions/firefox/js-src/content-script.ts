declare var browser;  //web extension API

function load() {
	console.log('Hello from content-script');
	document.title = 'Hello!!!';

	let loc = document.location;

	browser.runtime.sendMessage({
		CONTENT_SCRIPT_LOADED:true,
		location: {
			scheme: loc.protocol.toLowerCase().replace(':', ''),
			hostname: loc.hostname.toLowerCase(),
		}
	});

}

load();
