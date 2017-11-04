(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var firefox = require("./firefox");
var gState = null;
function onMessage(msg, senderInfo) {
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

},{"./firefox":2}],2:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
//read from non-synchronized persistent storage
function localGet(key) {
    return __awaiter(this, void 0, void 0, function () {
        var obj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.storage.local.get(key)];
                case 1:
                    obj = _a.sent();
                    return [2 /*return*/, new Promise(function (resolve) {
                            if (obj.hasOwnProperty(key)) {
                                resolve(obj[key]);
                            }
                            else {
                                resolve(null);
                            }
                        })];
            }
        });
    });
}
exports.localGet = localGet;
//write to non-synchronized persistent storage
function localSet(obj) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, browser.storage.local.set(obj)];
        });
    });
}
exports.localSet = localSet;
function getActiveTab() {
    return __awaiter(this, void 0, void 0, function () {
        var tabs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.tabs.query({ active: true, currentWindow: true })];
                case 1:
                    tabs = _a.sent();
                    if (tabs && tabs.length > 0)
                        return [2 /*return*/, tabs[0]];
                    else
                        throw new Error('getActiveTab failed');
                    return [2 /*return*/];
            }
        });
    });
}
function getActiveTabURL() {
    return __awaiter(this, void 0, void 0, function () {
        var tab;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getActiveTab()];
                case 1:
                    tab = _a.sent();
                    return [2 /*return*/, tab.url];
            }
        });
    });
}
exports.getActiveTabURL = getActiveTabURL;
function getActiveTabID() {
    return __awaiter(this, void 0, void 0, function () {
        var tab;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getActiveTab()];
                case 1:
                    tab = _a.sent();
                    return [2 /*return*/, tab.id];
            }
        });
    });
}
exports.getActiveTabID = getActiveTabID;
function addOnMessageListener(callback) {
    browser.runtime.onMessage.addListener(function (msg, sender, sendResponseFunc) {
        var res = callback(msg, sender);
        //if callback returned something non-null then respond synchronously		
        if (typeof (res) != 'undefined' && res !== null)
            sendResponseFunc(res);
    });
}
exports.addOnMessageListener = addOnMessageListener;
function loadContentScriptIntoActiveTab(allFrames) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.tabs.executeScript(null, {
                        file: "/content-script-bundle.js",
                        allFrames: allFrames,
                        runAt: 'document_end' //"The DOM has finished loading, but resources such as scripts and images may still be loading"
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, new Promise(function (resolve) { resolve(true); })];
            }
        });
    });
}
exports.loadContentScriptIntoActiveTab = loadContentScriptIntoActiveTab;
/**Send a message to another script which was loaded by the current extension.*/
function sendMessage(msgObject) {
    if (typeof (msgObject) != 'object' || msgObject === null)
        throw new Error('Invaild msgObject type');
    return browser.runtime.sendMessage(msgObject);
}
exports.sendMessage = sendMessage;
function sendMessageToAllContentScriptsInTab(tabId, msgObject) {
    if (typeof (msgObject) != 'object' || msgObject === null)
        throw new Error('Invaild msgObject type');
    return browser.tabs.sendMessage(tabId, msgObject);
}
exports.sendMessageToAllContentScriptsInTab = sendMessageToAllContentScriptsInTab;

},{}]},{},[1]);
