package com.calcpass.droidapp;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.text.method.PasswordTransformationMethod;
import android.view.View;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.calcpass.ImportResult;

public class DecryptionPasswordActivity extends AppCompatActivity
		implements CompoundButton.OnCheckedChangeListener, DecryptionTask.GlueToUI
{

	//Data is passed static because I fear Intent extra could be persisted on the whim of the OS (Parcelable)
	public static DataToImport dataToImport;

	private ProgressBar progBar;

	private long t1;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_decryption_password);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		if (dataToImport == null)
			finish();

		findViewById(R.id.lblErr).setVisibility(View.INVISIBLE);
		progBar = findViewById(R.id.progBar);
		progBar.setVisibility(View.INVISIBLE);


		CheckBox chkShowPass = findViewById(R.id.chkShowPass);
		chkShowPass.setOnCheckedChangeListener(this);
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


	//Called when the chkShowPass is clicked
	@Override
	public void onCheckedChanged(CompoundButton compoundButton, boolean isChecked) {
		if (compoundButton == findViewById(R.id.chkShowPass)) {

			EditText txtPassword = findViewById(R.id.txtPassword);
			if (isChecked)
				txtPassword.setTransformationMethod(null);
			else
				txtPassword.setTransformationMethod(new PasswordTransformationMethod());
		}
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

		t1 = System.currentTimeMillis();
		DecryptionTask task = new DecryptionTask(this, dataToImport, password);
		task.execute();
	}

	@Override
	public void onDecryptProgressUpdate(float percentDone) {
		progBar.setProgress((int)(percentDone * 100.0f));
	}

	@Override
	public void onDecryptFailed(String err) {
		long elapsedMs = System.currentTimeMillis() - t1;
		showError(err + "; took " + elapsedMs);

		progBar.setVisibility(View.INVISIBLE);

		//Allow retry
		findViewById(R.id.btnDecrypt).setEnabled(true);
	}

	@Override
	public void onDecryptSuccess(ImportResult importResult) {
		//TODO: go somewhere

		long elapsedMs = System.currentTimeMillis() - t1;
		showError("took " + elapsedMs);


		findViewById(R.id.btnDecrypt).setEnabled(true);

	}
}
