package com.calcpass;


import com.calcpass.util.Base64Implementation;
import com.calcpass.bytewords.*;
import com.calcpass.util.KDFProgressListener;
import com.calcpass.util.Util;

/**
 * Import from scanned QR code or bytewords.
 */
public class Import {

	/**
	 * @param decryptionPassword pass null to only verify basic data integrity and return unencrypted meta-data.
	 * */
	public static ImportResult ImportFromQRCode(String qrText, String decryptionPassword, KDFProgressListener progressCallback)
			throws ImportEx
	{
		byte[] data = Base64Implementation.instance.decodeBase64Strict(qrText);
		if (data == null)
			throw new ImportEx("Illegal Base64");

		if (data.length < 16)
			throw new ImportEx("Data too short");

		//First byte tells format
		int formatVer = data[0] & 0xFF;

		//Format0
		if (formatVer == 0) {
			return Format0.ImportRaw(data, decryptionPassword, progressCallback);
		} else {
			throw new ImportEx("Unsupported format version " + formatVer);
		}
	}

	public static ImportResult ImportPrinted(String seedName, String bytewords, String decryptionPassword, KDFProgressListener progressCallback)
		throws ImportEx, ByteWordsDecodeEx
	{
		//Decode the bytewords
		byte[] pdat = new ByteWordsDecoder().decode(bytewords);

		if (pdat.length < 16)
			throw new ImportEx("Not enough words");

		//First byte tells format
		int formatVer = pdat[0] & 0xFF;

		if (formatVer == 0) {
			final int fmt0_pdat_len = 34;
			if (pdat.length != fmt0_pdat_len) {
				throw new ImportEx("Expected exactly " + fmt0_pdat_len + " words (" + pdat.length + " given)");
			}

			byte[] rawSeedName = Util.encodeUTF8(seedName);

			//insert seed name before the MAC
			byte[] dat = Util.concatAll(Util.slice(pdat, 0, 28), rawSeedName, Util.slice(pdat, 28, pdat.length));

			return Format0.ImportRaw(dat, decryptionPassword, progressCallback);
		}
		else {
			throw new ImportEx("Unsupported format version " + formatVer);
		}
	}
}
