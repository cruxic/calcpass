(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
//The text or password field which was selected then the extension was invoked.
var gSelectedField = null;
function onMessage(msg, senderInfo) {
    console.log('content-script received: ', JSON.stringify(msg));
    /*if (msg.ARE_YOU_ALREADY_LOADED) {
        //respond with the same message which load() sent
        return buildLoadedMessage();
    }*/
    //if (msg.ENTER_PASSWORD) {
    //	console.log('got CONTENT_SCRIPT_LOADED');
    //	onBegin(msg.location.scheme, msg.location.hostname);
    //}
    return null;
}
function addOnMessageListener(callback) {
    browser.runtime.onMessage.addListener(function (msg, sender, sendResponseFunc) {
        var res = callback(msg, sender);
        //if callback returned something non-null then respond synchronously		
        if (typeof (res) != 'undefined' && res !== null)
            sendResponseFunc(res);
    });
}
/*Get the scheme, hostname and port of this document.  This uniquely
identifies which server we are talking to.  The result is a JSON array
like '["https","example.com",8080]'.  Port will be an empty string if
the default is being used.  All values are lower case.

This 3-tuple is the same as defined by the "Same Origin policy":
https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
*/
function getOrigin() {
    var loc = document.location;
    var scheme = loc.protocol.toLowerCase().replace(':', '');
    var hostname = loc.hostname.toLowerCase();
    var port = loc.port;
    //I avoid stringify(Array) because I don't want any white space
    return '[' + JSON.stringify(scheme) + ',' +
        JSON.stringify(hostname) + ',' +
        JSON.stringify(port) + ']';
}
function getNumChildFrames() {
    return window.frames.length;
}
function getFocusedPasswordInput() {
    var elm = document.activeElement;
    var types = ['text', 'password'];
    if (elm && elm.nodeName.toLowerCase() === 'input' &&
        types.indexOf(elm.getAttribute('type')) != -1) {
        return elm;
    }
    return null;
}
/**Return false if a calcpass content script is already loaded into this frame.
If not it marks it loaded and returns true.  This is necessary because Firefox
blindly loads a duplicate content script into the new JavaScript context every time
the toolbar is clicked.
*/
function loadCheck() {
    var ar = document.getElementsByTagName('BODY');
    if (ar.length == 0) {
        console.log('calcpass: no <body> element!');
        return true;
    }
    var body = ar[0];
    var ATTR = 'calcpass_loaded';
    if (body.getAttribute(ATTR))
        return false;
    body.setAttribute(ATTR, '-');
    return true;
}
function load() {
    if (loadCheck()) {
        //First time
        addOnMessageListener(onMessage);
    }
    else {
        console.log('calcpass: already loaded');
        //don't listen for messages but still send the READY message
    }
    var origin = getOrigin();
    gSelectedField = getFocusedPasswordInput();
    if (gSelectedField) {
        //highlight selected field for one second
        var origColor_1 = gSelectedField.style.backgroundColor;
        gSelectedField.style.backgroundColor = '#61FF52';
        setTimeout(function () {
            gSelectedField.style.backgroundColor = origColor_1;
        }, 1000);
    }
    browser.runtime.sendMessage({
        CONTENT_SCRIPT_READY: true,
        origin: origin,
        hasFocusedInput: gSelectedField != null,
        hasChildFrames: getNumChildFrames() > 0
    });
}
load();

},{}]},{},[1]);

1234; //ignored but necessary for tabs.executeScript()
