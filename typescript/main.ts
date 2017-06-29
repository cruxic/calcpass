import * as sha256 from './sha256';

function doload() {
	console.log("Hello sha256");


	let input = new Uint8Array([1,2,3,4,5]);

	let output = sha256.hash(input);

	alert(output.length);
}

window.addEventListener("load", function(e) {doload()});  
