package com.calcpass.droidapp;

import android.os.AsyncTask;

import com.calcpass.ImportEx;
import com.calcpass.Import;
import com.calcpass.ImportResult;
import com.calcpass.bytewords.ByteWordsDecodeEx;
import com.calcpass.parallel_bcrypt.ParallelBcrypt;
import com.calcpass.util.KDFProgressListener;

/**
 * Background thread for CPU intensive KDF and decryption.
 */
public class DecryptionTask extends AsyncTask<Void, Float, Void> implements KDFProgressListener {
	/*
	"AsyncTask guarantees that all callback calls are synchronized in such a way that the
	  following operations are safe without explicit synchronizations.

    	1. Set member fields in the constructor or onPreExecute(), and refer to them in doInBackground(Params...).
    	2. Set member fields in doInBackground(Params...), and refer to them in onProgressUpdate(Progress...) and onPostExecute(Result).
    "

	https://developer.android.com/guide/components/processes-and-threads.html
	*/

	private String error;
	private ImportResult importResult;
	private DataToImport data;
	private String decryptionPassword;


	public interface GlueToUI {
		void onDecryptProgressUpdate(float percentDone);
		void onDecryptFailed(String err);
		void onDecryptSuccess(ImportResult importResult);
	}

	private GlueToUI glueToUI;

	/**
	 * @param glueToUI are callbacks which will be executed on the UI thread.
	 * */
	public DecryptionTask(GlueToUI glueToUI, DataToImport data, String decryptionPassword) {
		this.glueToUI = glueToUI;
		this.data = data;
		this.decryptionPassword = decryptionPassword;
	}


	@Override
	protected Void doInBackground(Void... params) {
		try {
			if (data.qrData != null)
				importResult = Import.ImportFromQRCode(data.qrData, decryptionPassword, this);
			else
				importResult = Import.ImportPrinted(data.typedSeedName, data.typedBytewords, decryptionPassword, this);
		}
		catch (ByteWordsDecodeEx ex) {
			error = ex.getMessage();
		}
		catch (ImportEx ex) {
			error = ex.getMessage();
		}
		catch (Exception ex) {
			//should not happen
			ex.printStackTrace();
			error = ex.toString();
		}

		return null;
	}

	@Override
	public void onKDFProgress(float percentDone) {
		//executes in doInBackground() thread
		publishProgress(percentDone);
	}


	protected void onProgressUpdate(Float... progress) {
		//This runs in the UI thread
		float percentDone = progress[0];

		glueToUI.onDecryptProgressUpdate(percentDone);
	}

	protected void onPostExecute(Void result) {
		//This runs in the UI thread

		if (error != null)
			glueToUI.onDecryptFailed(error);
		else
			glueToUI.onDecryptSuccess(importResult);
	}

}
