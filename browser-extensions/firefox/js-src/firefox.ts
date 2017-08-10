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

export async function getActiveTabID(): Promise<number> {
	var tab = await getActiveTab();
	return tab.id;
}


export function addOnMessageListener(callback:(msg, sender)=>any) {
	browser.runtime.onMessage.addListener((msg, sender, sendResponseFunc) => {
		var res = callback(msg, sender);
		//if callback returned something non-null then respond synchronously		
		if (typeof(res) != 'undefined' && res !== null)
			sendResponseFunc(res);
	});
}

export async function loadContentScriptIntoActiveTab(allFrames:boolean): Promise<boolean> {
	await browser.tabs.executeScript(null, {
		  file: "/content-script-bundle.js",
		  allFrames: allFrames,
		  runAt: 'document_end' //"The DOM has finished loading, but resources such as scripts and images may still be loading"
	});

	return new Promise<boolean>((resolve) => {resolve(true);});
}

/**Send a message to another script which was loaded by the current extension.*/
export function sendMessage(msgObject:any):Promise<any> {
	if (typeof(msgObject) != 'object' || msgObject === null)
		throw new Error('Invaild msgObject type');

	return browser.runtime.sendMessage(msgObject);
}

export function sendMessageToContentScript(tabId:number, msgObject:any):Promise<any> {
	if (typeof(msgObject) != 'object' || msgObject === null)
		throw new Error('Invaild msgObject type');

	return browser.tabs.sendMessage(tabId, msgObject);
}
