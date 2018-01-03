package com.calcpass.droidapp;


import com.calcpass.ImportResult;

/**
 * Seed import can be done by scanning QR code or typing the seed name and the bytewords.
 * */
class DataToImport {
	/*Pre-parsed meta-data.  seed member is null*/
	public ImportResult metaData;

	public String typedSeedName;
	public String typedBytewords;

	/**
	 * If non-null then other fields are ignored.
	 * */
	public String qrData;
}
