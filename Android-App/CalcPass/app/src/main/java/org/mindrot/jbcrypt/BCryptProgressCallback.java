package org.mindrot.jbcrypt;

/**
 * (added by cruxic)
 * Used to monitor the progress of a bcrypt calculation.
 */
public interface BCryptProgressCallback {
	/**
	 * @param percentDone 0.0 through 1.0
	 * */
	void onBcryptProgress(float percentDone);
}
