package com.calcpass;

/**
 * A 128bit seed and all the settings associated with it.
 */
public class Seed {
	/**
	 * User given name of this seed.
	 * */
	public String name;

	//The 128bit random seed (always 16 bytes)
	public byte[] bytes;

	public AlgorithmType algorithm;

	//The default password output format
	public PassFmt DefaultPasswordFormat;
}
