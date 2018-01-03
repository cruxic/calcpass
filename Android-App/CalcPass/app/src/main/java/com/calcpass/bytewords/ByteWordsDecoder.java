package com.calcpass.bytewords;

import java.util.HashMap;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

public class ByteWordsDecoder {
	private HashMap<String, Integer> wordMap;

	public ByteWordsDecoder() {
		//Create map of word to byte value
		wordMap = new HashMap<String, Integer>(350);  //.75 loadfactor
		int i = 0;
		for (String word: Words.loadWordList()) {
			wordMap.put(word, i++);
		}
	}

	/**
	Decode a list of words into bytes.  White space between words is allowed
	but not mandatory.	
	*/
	public byte[] decode(String text) throws ByteWordsDecodeEx {
		ByteArrayOutputStream buf = new ByteArrayOutputStream();

		char c;
		String word;
		int lineNum = 1;
		int i = 0;
		Integer byteVal;

		//for each character...
		int slen = text.length();

		while (i < slen) {
			//Skip white space (optional)
			while (i < slen) {
				c = text.charAt(i);

				//count lines
				if (c == '\n')
					lineNum++;
				else if (c != ' ' && c != '\t' && c != '\r')
					break;  //not white
				
				i++;
			}


			//Read 3 characters
			if (i == slen)
				break;
			else if (i + 3 > slen)
				throw new ByteWordsDecodeEx("Incomplete word at end", lineNum);
			word = text.substring(i, i+3);

			byteVal = wordMap.get(word);
			if (byteVal == null) {
				throw new ByteWordsDecodeEx("\"" + word + "\" is not a valid word", lineNum);
			}

			buf.write(byteVal.intValue());
			i += 3;
		}

		return buf.toByteArray();
	}
}

