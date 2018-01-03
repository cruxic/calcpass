package com.calcpass.droidapp;

import android.content.Intent;
import android.content.res.Resources;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.text.method.PasswordTransformationMethod;
import android.view.View;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.calcpass.ImportResult;

public class DecryptionPasswordActivity extends AppCompatActivity
		implements DecryptionTask.GlueToUI
{

	//Data is passed static because I fear Intent extras could be persisted on the whim of the OS (Parcelable)
	public static DataToImport dataToImport;

	private ProgressBar progBar;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_decryption_password);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		Resources res = getResources();

		if (dataToImport == null)
			finish();

		setTitle(res.getString(R.string.decrypt_title, dataToImport.metaData.seedName));

		TextView lblSeedInfo = findViewById(R.id.lblSeedInfo);
		String lines = res.getString(R.string.decrypt_info_seedName, dataToImport.metaData.seedName) + "\n" +
				res.getString(R.string.decrypt_info_formatVer, dataToImport.metaData.formatVer) + "\n" +
				res.getString(R.string.decrypt_info_encKDFType, dataToImport.metaData.encryptionKDF.name());
		lblSeedInfo.setText(lines);

		findViewById(R.id.lblErr).setVisibility(View.INVISIBLE);
		progBar = findViewById(R.id.progBar);
		progBar.setVisibility(View.INVISIBLE);

		EditText txtPassword = findViewById(R.id.txtPassword);
		txtPassword.setText("Super Secret");
	}


	@Override
	protected void onStart() {
		super.onStart();

		if (dataToImport == null)
			finish();

		progBar = findViewById(R.id.progBar);
	}

	@Override
	protected void onStop() {
		super.onStop();

		//allow GC of sensitive memory
		dataToImport = null;
	}


	public void onClick_btnShowHide(View v) {
		EditText txtPassword = findViewById(R.id.txtPassword);
		boolean showingPass = txtPassword.getTransformationMethod() == null;
		if (showingPass)
			txtPassword.setTransformationMethod(new PasswordTransformationMethod());
		else
			txtPassword.setTransformationMethod(null);
	}

	private void showError(String msg) {
		TextView lblErr = findViewById(R.id.lblErr);
		if (msg == null)
			lblErr.setVisibility(View.INVISIBLE);
		else {
			lblErr.setText(msg);
			lblErr.setVisibility(View.VISIBLE);
		}

	}

	public void onClickDecrypt(View v) {
		EditText txtPassword = findViewById(R.id.txtPassword);

		String password = txtPassword.getText().toString().trim();

		if (password.length() < 8) {
			showError("Password must be at least 8 characters.");
			return;
		}

		//Clear any errors
		showError(null);

		//Prevent repeated clicks
		findViewById(R.id.btnDecrypt).setEnabled(false);

		//Show progress
		progBar.setVisibility(View.VISIBLE);
		progBar.setProgress(0);

		DecryptionTask task = new DecryptionTask(this, dataToImport, password);
		task.execute();
	}

	@Override
	public void onDecryptProgressUpdate(float percentDone) {
		progBar.setProgress((int)(percentDone * 100.0f));
	}

	@Override
	public void onDecryptFailed(String err) {
		//long elapsedMs = System.currentTimeMillis() - startTime;
		showError(err);

		progBar.setVisibility(View.INVISIBLE);

		//Allow retry
		findViewById(R.id.btnDecrypt).setEnabled(true);
	}

	@Override
	public void onDecryptSuccess(ImportResult importResult) {

		DecryptSuccessActivity.decryptedData = importResult;
		startActivity(new Intent(this, DecryptSuccessActivity.class));

		dataToImport = null;
		finish();
	}
}
