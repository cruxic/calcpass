package com.calcpass.parallel_bcrypt;

import com.calcpass.util.KDFProgressListener;
import com.calcpass.util.NopKDFProgressListener;
import com.calcpass.util.Util;
import org.mindrot.jbcrypt.BCrypt;
import org.mindrot.jbcrypt.BCryptProgressCallback;

public class ParallelBcrypt {
	public static final int BCRYPT_SALT_SIZE = 16;


	static String standard_bcrypt(String password, final byte[] salt, int cost, BCryptProgressCallback progressCallback) {
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

		return BCrypt.hashpw(password, prefixAndSalt, progressCallback);
	}

	public static byte[] Hash(int nThreads, byte[] plainTextPassword, byte[] salt, int cost) {
		return Hash(nThreads, plainTextPassword, salt, cost, new NopKDFProgressListener());
	}

	public static void benchmark() {
		byte[] salt = new byte[16];
		String pass = "Super Secret Code";
		for (int i = 0; i < 16; i++)
			salt[i] = (byte)i;

		long t1 = System.currentTimeMillis();
		String hash = standard_bcrypt(pass, salt, 10, BCrypt.getNopProgressCallback());
		long elapsed = System.currentTimeMillis() - t1;

		System.out.println("Bcrypt took " + elapsed + "ms");

		if (!hash.equals("$2a$10$..CA.uOD/eaGAOmJB.yMBuiq9xfN4CKTcPYAPS1FGVRYH2ZJCdBuW"))
			throw new RuntimeException("wrong hash");
	}


	public static byte[] Hash(int nThreads, byte[] plainTextPassword, byte[] salt, int cost, KDFProgressListener progressCallback) {
		if (plainTextPassword.length == 0)
			throw new IllegalArgumentException("Empty password");

		if (salt.length != BCRYPT_SALT_SIZE)
			throw new IllegalArgumentException("Wrong bcrypt salt length");

		if (nThreads < 1 || nThreads > 32)
			throw new IllegalArgumentException("nThreads out of range");

		ParallelBcryptThread[] threads = new ParallelBcryptThread[nThreads];

		ProgressWatcher progWatcher = new ProgressWatcher();

		//Spawn each thread
		for (int i = 0; i < nThreads; i++) {

			//The last spawned thread is most likely to finish last so it's the
			// one which we will report progress from
			BCryptProgressCallback pcb;
			if (i + 1 == nThreads)
				pcb = progWatcher;
			else
				pcb = BCrypt.getNopProgressCallback();

			threads[i] = new ParallelBcryptThread(plainTextPassword, i, salt, cost, pcb);
			threads[i].start();

			//System.out.println("Thread " + i);
			//threads[i].run();
			//progressCallback.onKDFProgress((i + 1) / (float)nThreads);
		}

		//Report progress every 250ms
		float percentDone = 0.0f;
		while (percentDone < 1.0f) {
			percentDone = progWatcher.smartSleep(250);
			progressCallback.onKDFProgress(percentDone);
		}

		//Join each thread and concat the results
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

		byte[] allHashes = Util.encodeUTF8(sb.toString());

		return Util.sha256(allHashes);
	}
}

/**
Used internally by ParallelBcrypt.Hash()
*/
class ParallelBcryptThread extends Thread {
	private final byte[] plainText;
	private final int threadIndex;
	private final byte[] salt;
	private final int cost;
	private final BCryptProgressCallback progressCallback;

	/*the resulting bcrypt base64 with the salt characters removed*/
	String result;
	
	RuntimeException failReason;	
	
	ParallelBcryptThread(byte[] plainText, int threadIndex, byte[] salt, int cost, BCryptProgressCallback progressCallback) {
		this.plainText = plainText;
		this.threadIndex = threadIndex;
		this.salt = salt;
		this.cost = cost;
		this.progressCallback = progressCallback;
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
		
			String b64 = ParallelBcrypt.standard_bcrypt(hexPass, threadSalt, cost, progressCallback);

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

/**
 * This is for internal use.  Careful synchronization semantics.
 * */
class ProgressWatcher implements BCryptProgressCallback {
	private float percentDone;

	/**
	 * Sleep for specified milliseconds or until progress reaches 1.0 (100%)
	 * */
	public synchronized float smartSleep(int sleepMillis) {
		if (percentDone < 1.0f) {
			try {
				//wakeable sleep
				wait(250);
			} catch (InterruptedException e) {
				//treat like normal timeout
			}
		}

		return percentDone;
	}


	@Override
	public synchronized void onBcryptProgress(float percentDone) {
		this.percentDone = percentDone;

		//Wake Hash() thread only when we're all done.
		if (percentDone >= 1.0f) {
			this.notify();
		}
	}
}
