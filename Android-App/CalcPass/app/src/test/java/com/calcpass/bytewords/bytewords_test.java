package com.calcpass.bytewords;

import static org.junit.Assert.*;
import org.junit.Test;

public class bytewords_test {

	private ByteWordsDecodeEx decodeFails(ByteWordsDecoder decoder, String text) {
		try {
			decoder.decode(text);
			//should not reach here
			assertTrue(false);
			return null;
		}
		catch (ByteWordsDecodeEx de) {
			return de;
		}
	}

	@Test
	public void test_basic() throws Exception {
		assertEquals(256, Words.loadWordList().length);
	
		ByteWordsEncoder encoder = new ByteWordsEncoder();
		ByteWordsDecoder decoder = new ByteWordsDecoder();

		byte[] input = "Hello World!".getBytes("UTF-8");
		String words = encoder.encode(input);
		//System.out.println(words.replace("\n", "\\n"));
		assertEquals("fix hum job\njob jug bug\nhas jug kit\njob hug bun\n", words);

		byte[] bytes = decoder.decode(words);
		assertArrayEquals(input, bytes);

		//
		// Decoding errors
		//
		ByteWordsDecodeEx ex;

		//word too short
		ex = decodeFails(decoder, "fog ic joy");
		assertEquals("\"ic \" is not a valid word", ex.getMessage());
		assertEquals(1, ex.lineNum, 1);

		//word too long
		ex = decodeFails(decoder, "fog\nicee joy");
		assertEquals("\"e j\" is not a valid word", ex.getMessage());
		assertEquals(2, ex.lineNum);

		//"bee" is not a recognized word
		ex = decodeFails(decoder, "fog\r\nbit\r\njoy\r\nbee\r\n");
		assertEquals(ex.getMessage(), "\"bee\" is not a valid word");
		assertEquals(4, ex.lineNum);
	}

	@Test
	public void test_all_words() throws Exception {
		ByteWordsEncoder encoder = new ByteWordsEncoder();
		ByteWordsDecoder decoder = new ByteWordsDecoder();

		//encode and decode possible byte values
		byte[] seq = new byte[256];
		for (int i = 0; i < 256; i++)
			seq[i] = (byte)i;

		String words = encoder.encode(seq);
		final String expect = "ace act add age aid aim air ale all and ant any ape arm art ash ask ate axe bad bag ban bar bat bay bed beg bet big bop box boy bug bun bus bit bye cab can cap car cat cog cow cry cup cut dad day den did dig dim dip dog dot dry dug ear eat egg elf end fab fan far fat fax fee few fig fit fix fly fog fox fun fur gag gap gas got gum gut guy had ham has hat hen her hex hid him hip his hit hog how hub hug hum hut ice ink jag jam jar job jog joy jug key kid kit lab lap law lay leg let lid lie lip log low lug mad mag man map max men met mid min mix mom mow mud mug nag nap nay net new now nut oak oar oat odd off oil old out owl own pad pal pan paw pay peg pen pet pig pin pit pop pot pub put rad rag ram ran rap rat raw ray red rex rib rid rim rip row rub rug rum run rut sad sat saw say set she shy sip sir sit ski sky sly sow soy spa spy sum sun tab tag tan tap tar tax tex the til tin tip top toy try tub tug use van vet vex vow wad wag war was wax way web wet who why wig win won wow yak yam yes yet yum zap zen zip zoo ";
		assertEquals(expect, expect.replace('\n', ' '));

		byte[] bytes = decoder.decode(words);
		assertArrayEquals(seq, bytes);

	}
	
}
