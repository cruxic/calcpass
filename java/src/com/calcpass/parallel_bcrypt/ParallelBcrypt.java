package com.calcpass.parallel_bcrypt;

import com.calcpass.util.Util;
import org.mindrot.jbcrypt.BCrypt;
import java.util.Arrays;
import java.io.UnsupportedEncodingException;

public class ParallelBcrypt {
	public static final int BCRYPT_SALT_SIZE = 16;

	
	static String standard_bcrypt(String password, final byte[] salt, int cost) {
		//A slightly hacky way to tell jBcrypt which salt to use.
		// I considered using Bcrypt.crypt_raw() but it would take more work.
		java.security.SecureRandom saltSource = new java.security.SecureRandom() {
			public void nextBytes(byte[] buffer) {
				if (buffer.length != BCRYPT_SALT_SIZE || salt.length != BCRYPT_SALT_SIZE)
					throw new IllegalArgumentException("wrong salt size!");

				System.arraycopy(salt, 0, buffer, 0, BCRYPT_SALT_SIZE);
			}
		};

		//Encode the cost and salt as bcrypt-base64
		String prefixAndSalt = BCrypt.gensalt(cost, saltSource);

		return BCrypt.hashpw(password, prefixAndSalt);
	}

	

	public static byte[] Hash(int nThreads, byte[] plainTextPassword, byte[] salt, int cost) {
		if (plainTextPassword.length == 0)
			throw new IllegalArgumentException("Empty password");

		if (salt.length != BCRYPT_SALT_SIZE)
			throw new IllegalArgumentException("Wrong bcrypt salt length");

		if (nThreads < 1 || nThreads > 32)
			throw new IllegalArgumentException("nThreads out of range");

		ParallelBcryptThread[] threads = new ParallelBcryptThread[nThreads];

		//Spawn each thread
		for (int i = 0; i < nThreads; i++) {
			threads[i] = new ParallelBcryptThread(plainTextPassword, i, salt, cost);
			threads[i].start();			
		}

		//Wait each thread to finish and concat eash result
		StringBuilder sb = new StringBuilder(nThreads * 128);
		for (int i = 0; i < nThreads; i++) {
			try {
				threads[i].join();
			}
			catch (InterruptedException ie) {
				throw new RuntimeException(ie);
			}

			if (threads[i].failReason != null)
				throw threads[i].failReason;

			sb.append(threads[i].result);
		}

		byte[] allHashes;
		try {
			allHashes = sb.toString().getBytes("UTF-8");
		}
		catch (UnsupportedEncodingException uee) {
			throw new RuntimeException(uee);
		}

		return Util.sha256(allHashes);
	}
}

/**
Used internally by ParallelBcrypt.Hash()
*/
class ParallelBcryptThread extends Thread {
	final byte[] plainText;
	final int threadIndex;
	final byte[] salt;
	final int cost;

	/*the resulting bcrypt base64 with the salt characters removed*/
	String result;
	
	RuntimeException failReason;	
	
	ParallelBcryptThread(byte[] plainText, int threadIndex, byte[] salt, int cost) {
		this.plainText = plainText;
		this.threadIndex = threadIndex;
		this.salt = salt;
		this.cost = cost;
	}

	public void run() {
		try {
			//Derive a distinct password and salt for this thread to work on:
			byte[] threadByte = new byte[]{(byte)(threadIndex + 1)};
			byte[] threadPassword = Util.hmacSha256(plainText, threadByte);
			
			byte[] threadSalt = new byte[ParallelBcrypt.BCRYPT_SALT_SIZE];
			System.arraycopy(Util.hmacSha256(salt, threadByte), 0, threadSalt, 0, threadSalt.length);

			//Some bcrypt implementations are broken (eg PHP) because they truncate
			// the password at the first null byte!  Therefore I'll pass 64 hex characters.
			//(bcrypt can handle up to 72 bytes)
			String hexPass = Util.hexEncode(threadPassword);

			//ensure lower case
			hexPass = hexPass.toLowerCase();
			if (hexPass.length() != 64) {
				failReason = new IllegalStateException("bad hex encoding");
				return;
			}
		
			String b64 = ParallelBcrypt.standard_bcrypt(hexPass, threadSalt, cost);

			//All bcrypt hashes are 60 characters.
			if (b64.length() != 60)
				throw new IllegalStateException("wrong bcrypt output length");

			//remove the salt and cost prefix (first 29 chars)
			result = b64.substring(29);
		}
		catch (RuntimeException ex) {
			failReason = ex;
		}		
	}

}
