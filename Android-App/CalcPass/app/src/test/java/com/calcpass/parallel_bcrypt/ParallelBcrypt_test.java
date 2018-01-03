package com.calcpass.parallel_bcrypt;

import com.calcpass.util.Util;

import static org.junit.Assert.*;
import org.junit.Test;
import org.mindrot.jbcrypt.BCryptProgressCallback;


public class ParallelBcrypt_test {
	/**
	Sanity check that the bcrypt library being used is good.
	*/
	@Test
	public void test_bcrypt_implementation() throws Exception {
		TestBcryptProgress progress = new TestBcryptProgress();

		//salt is "abcdefghijklmnopqrstuu" as bcrypt-base64
		byte[] salt = Util.hexDecode("71d79f8218a39259a7a29aabb2dbafc3");
		
		//parallel_bcrypt sends 64 bytes to bcrypt.  Prove that the
		// implementation does not truncate it.
		String pass64 = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
		String hash = ParallelBcrypt.standard_bcrypt(pass64, salt, 5, progress);
		assertEquals("$2a$05$abcdefghijklmnopqrstuusN64mi0Q3MHT4E2PLNsVMiw2Jh1hNE6", hash);
		assertTrue(progress.percent >= 1.0f);

		String pass65 = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab";
		progress.percent = 0.0f;
		hash = ParallelBcrypt.standard_bcrypt(pass65, salt, 5, progress);
		assertEquals("$2a$05$abcdefghijklmnopqrstuulBPHoU3/c65NkXOJMDkVnN3KklTvm1a", hash);
		assertTrue(progress.percent >= 1.0f);

		//the above results were verified with PHP's bcrypt
	}


	@Test
	public void test1() throws Exception {
		byte[] pass = "Super Secret Password".getBytes();

		//salt is "abcdefghijklmnopqrstuu" as bcrypt-base64
		byte[] salt = Util.hexDecode("71d79f8218a39259a7a29aabb2dbafc3");


		byte[] hash = ParallelBcrypt.Hash(4, pass, salt, 5);

		String expect = "50bec3b110e540afb4e35ee4fb657a7c7a7187916763a78851418605daa25f8a";
		assertEquals(expect, Util.hexEncode(hash));
	}
}

class TestBcryptProgress implements BCryptProgressCallback
{
	public float percent;

	@Override
	public void onBcryptProgress(float percentDone) {
		percent = percentDone;
	}
}