package com.calcpass.droidapp;

import android.content.Intent;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.TextView;

public class TestKeyStoreActivity extends AppCompatActivity {
	private TextView lblResult;
	private CalcpassKeyStore keystore;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_test_key_store);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		lblResult = findViewById(R.id.lblResult);
		lblResult.setVisibility(View.INVISIBLE);
	}

	private void showResult(String msg, boolean isError) {
		if (msg == null) {
			lblResult.setVisibility(View.INVISIBLE);
			return;
		}

		if (isError)
			lblResult.setTextColor(0xFF880000);  //red
		else
			lblResult.setTextColor(0xFF008800);  //green

		lblResult.setText(msg);

		lblResult.setVisibility(View.VISIBLE);
	}

	public void onBtnCheck(View v) {
		//Clear previous error
		showResult(null, false);

		try {
			//Init key store
			if (keystore == null)
				keystore = new CalcpassKeyStore(getResources());

			if (!keystore.doesKeyExist(CalcpassKeyStore.TEST_KEY_ID)) {
				keystore.installHmacSha256Key(CalcpassKeyStore.TEST_KEY_ID, keystore.makeTestSeed());
			}

			keystore.requestKeyUnlock(CalcpassKeyStore.TEST_KEY_ID, this);
			//onActivityResult will be called next

		} catch (CalcpassKeystoreEx ex) {
			showResult(ex.getMessage(), true);
		}
	}

	private void afterUnlocked() {
		try {
			boolean ok = keystore.verifyHmacSha256Key(CalcpassKeyStore.TEST_KEY_ID, keystore.makeTestSeed());
			if (ok)
				showResult("Success!", false);
			else
				showResult("Wrong HMAC result!", true);
		} catch (CalcpassKeystoreEx ex) {
			showResult(ex.getMessage(), true);
			ex.printStackTrace();
		}
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		// Check which request we're responding to
		if (requestCode == CalcpassKeyStore.UNLOCK_REQUEST_CODE) {
			if (resultCode == RESULT_OK) {
				afterUnlocked();
			}
			else {
				showResult("User denied unlock", true);
			}
		}
	}


	public void onBtnSkip(View v) {
		startActivity(new Intent(this, ImportSeedActivity.class));

	}


}
