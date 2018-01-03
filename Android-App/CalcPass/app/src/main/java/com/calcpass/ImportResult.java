package com.calcpass;

/**
 * Result of Import.ImportFromQRCode() etc
 */
public class ImportResult {
	public KDFType encryptionKDF;
	public int formatVer;
	public String seedName;

	public Seed seed;
}
