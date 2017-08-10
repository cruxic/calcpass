import * as firefox from './firefox';

var gState:any = null;


function onMessage(msg, senderInfo):any {
	console.log('background onMessage was called!', JSON.stringify(msg));

	//if (msg.CONTENT_SCRIPT_LOADED) {
	//	console.log('got CONTENT_SCRIPT_LOADED');
	//	setScreen(new SelectSiteName(msg.location.scheme, msg.location.hostname));
	//}

	if (msg.REMEMBER_STATE) {
		gState = msg;
	}
	else if (msg.FETCH_STATE) {
		if (gState && gState.REMEMBER_STATE)
			return gState;
		else
			return false;
	}

	//no response
	return null;
}

firefox.addOnMessageListener(onMessage);
