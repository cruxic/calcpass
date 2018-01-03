package com.calcpass.bytewords;


public class ByteWordsEncoder {
	private int wordsPerLine;
	private String[] wordList;

	public ByteWordsEncoder() {
		this(3);
	}

	public ByteWordsEncoder(int wordsPerLine) {
		this.wordsPerLine = wordsPerLine;
		wordList = Words.loadWordList();
	}

	public String encode(byte[] data) {
		StringBuilder sb = new StringBuilder(data.length * 4 + 16);
		
		int lineLen = 0;
		for (int i = 0; i < data.length; i++) {
			if (lineLen >= wordsPerLine) {
				sb.append('\n');
				lineLen = 0;
			}
			else if (i > 0)
				sb.append(' ');

			sb.append(wordList[data[i] & 0xFF]);
			lineLen++;
		}

		if (lineLen > 0)
			sb.append('\n');
			
		return sb.toString();
	}
}

