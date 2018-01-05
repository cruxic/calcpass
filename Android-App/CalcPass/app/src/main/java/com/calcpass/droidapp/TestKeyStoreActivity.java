package com.calcpass.droidapp;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

public class TestKeyStoreActivity extends AppCompatActivity {
	private TextView lblResult;
	private KeyStoreOperations keystore;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_test_key_store);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		lblResult = findViewById(R.id.lblResult);
		lblResult.setVisibility(View.INVISIBLE);

		DroidUtil.enableTextViewHyperlinks(findViewById(R.id.lblMsg1));
		DroidUtil.enableTextViewHyperlinks(findViewById(R.id.lblMsg2));
	}

	private void showError(String msg) {
		showResult(msg, getColor(R.color.errorText));
	}

	private void showResult(String msg, int rgbColor) {
		if (msg == null) {
			lblResult.setVisibility(View.INVISIBLE);
			return;
		}

		lblResult.setTextColor(0xFF000000 | rgbColor);
		lblResult.setText(msg);
		lblResult.setVisibility(View.VISIBLE);
	}

	public void onBtnCheck(View v) {
		//Clear previous error
		showError(null);

		try {
			//Init key store
			if (keystore == null)
				keystore = new KeyStoreOperations(getResources());

			keystore.installTestKey();

			keystore.requestKeyUnlock(KeyStoreOperations.TEST_KEY_ID, this);
			//onActivityResult will be called next

		} catch (KeyStoreOperationEx ex) {
			showError(ex.getMessage());
		}
	}

	private void afterUnlocked() {
		try {
			keystore.verifyTestKey();

			boolean hardwareBacked = keystore.getKeyInfo(KeyStoreOperations.TEST_KEY_ID).isInsideSecureHardware();

			if (hardwareBacked)
				showResult("Keystore is Hardware-backed.", 0x00aa00);  //green
			else
				showResult("Software-only Keystore.", 0x000000);  //black

			//Change "Skip" button to "Next"
			Button btnSkip = findViewById(R.id.btnSkip);
			btnSkip.setText(R.string.test_keystore_btnNext);

		} catch (KeyStoreOperationEx ex) {
			showError(ex.getMessage());
			ex.printStackTrace();
		}
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		// Check which request we're responding to
		if (requestCode == KeyStoreOperations.UNLOCK_REQUEST_CODE) {
			if (resultCode == RESULT_OK) {
				afterUnlocked();
			}
			else {
				showError("User denied unlock");
			}
		}
	}


	public void onBtnSkip(View v) {
		startActivity(new Intent(this, ImportSeedActivity.class));

	}


}
