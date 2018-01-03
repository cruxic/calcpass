package com.calcpass.bytewords;

public class ByteWordsDecodeEx extends java.io.IOException {
	public int lineNum;
	public ByteWordsDecodeEx(String message, int lineNum) {
		super(message);
		this.lineNum = lineNum;
	}
}
