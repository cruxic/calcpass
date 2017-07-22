declare var browser;

//read from non-synchronized persistent storage
export async function localGet(key:string): Promise<any> {
	var obj = await browser.storage.local.get(key);
	return new Promise((resolve) => {
		if (obj.hasOwnProperty(key)) {
			resolve(obj[key]);
		} else {
			resolve(null);
		}
	});
}

//write to non-synchronized persistent storage
export async function localSet(obj:Object): Promise<any> {
	return browser.storage.local.set(obj);
}


async function getActiveTab(): Promise<any> {
	var tabs = await browser.tabs.query({active: true, currentWindow: true});
	if (tabs && tabs.length > 0)
		return tabs[0];
	else
		throw new Error('getActiveTab failed');
}

export async function getActiveTabURL(): Promise<string> {
		var tab = await getActiveTab();
		return tab.url;
}

export function addOnMessageListener(callback:(msg, sender)=>void) {
	browser.runtime.onMessage.addListener((msg, sender, sendResponseFunc) => {
		callback(msg, sender);
	});
}

export async function loadContentScriptIntoActiveTab(): Promise<boolean> {
	await browser.tabs.executeScript(null, {
		  file: "/content-script-bundle.js",
		  allFrames: false,
		  
	});

	return new Promise<boolean>((resolve) => {resolve(true);});
}


