package com.calcpass;

import com.calcpass.util.Base64Implementation;
import com.calcpass.util.Java8Base64Implementation;
import com.calcpass.util.NopKDFProgressListener;

import static org.junit.Assert.*;
import org.junit.Test;


public class Import_Test {
	public Import_Test() {
		Base64Implementation.instance = new Java8Base64Implementation();
	}


	@Test
	public void test_import_format0() throws Exception {
		byte[] expect = new byte[16];
		for (int i = 0; i < 16; i++)
			expect[i] = (byte)(i+1);

		NopKDFProgressListener progress = new NopKDFProgressListener();

		//Illegal base64
		try {
			Import.ImportFromQRCode("abcdefg*&&^%&$%&$&", "Super Secret", progress);
			fail();
		}
		catch (ImportEx ie) {
			assertEquals("Illegal Base64", ie.getMessage());
		}

		String qrCodeText = "AAzg6d3YaDLhp1ymm6Tnek2elqkIQyKwNVC5W1Rlc3QtU2VlZBjtA9KznA";
		ImportResult ir = Import.ImportFromQRCode(qrCodeText, "Super Secret", progress);
		assertEquals(0, ir.formatVer);
		assertEquals(KDFType.QuadBcrypt12, ir.encryptionKDF);
		assertEquals(ir.seedName, "Test-Seed");
		
		assertEquals(ir.seed.name, "Test-Seed");
		assertArrayEquals(expect, ir.seed.bytes);
		assertEquals(PassFmt.Friendly9, ir.seed.DefaultPasswordFormat);
		assertEquals(AlgorithmType.Alg2018a, ir.seed.algorithm);

		//Same data as bytewords
		String words = 
				"ace ape toy " +
				"wad tin tar " +
				"ink did try " +
				"pin hid pig " +
				"out pen vex " +
				"lie fur pad " +
				"oat pop all " +
				"fax bus ran " +
				"dip gas rim " +
				"hex bay wax " +
				"age sum raw " +
				"owl ";
		ir = Import.ImportPrinted("Test-Seed", words, "Super Secret", progress);
		assertEquals(0, ir.formatVer);
		assertEquals(KDFType.QuadBcrypt12, ir.encryptionKDF);
		assertEquals(ir.seedName, "Test-Seed");
		
		assertEquals(ir.seed.name, "Test-Seed");
		assertArrayEquals(expect, ir.seed.bytes);
		assertEquals(PassFmt.Friendly9, ir.seed.DefaultPasswordFormat);
		assertEquals(AlgorithmType.Alg2018a, ir.seed.algorithm);




/*
Test-Seed
ace ape toy
wad tin tar
ink did try
pin hid pig
out pen vex
lie fur pad
oat pop all
fax bus ran
dip gas rim
hex bay wax
age sum raw
owl

AAzg6d3YaDLhp1ymm6Tnek2elqkIQyKwNVC5W1Rlc3QtU2VlZBjtA9KznA==


*/
	}
}
