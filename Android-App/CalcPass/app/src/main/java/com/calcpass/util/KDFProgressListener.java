package com.calcpass.util;

/**
 * Progress listener for heavy key derivation.
 */
public interface KDFProgressListener {
	/**
	 * Called roughly every 250ms until progress reaches 1.0.  This is called in the same thread which
	 * executed ParallelBcrypt.Hash().
	 *
	 * @param percentDone 0.0 through 1.0
	 * */
	void onKDFProgress(float percentDone);
}
