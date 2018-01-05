package com.calcpass.droidapp;

import android.content.Intent;
import android.content.res.Resources;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.calcpass.ImportResult;
import com.calcpass.Seed;
import com.calcpass.util.Util;

public class DecryptSuccessActivity extends AppCompatActivity {

	//Data is passed static because I fear Intent extras could be persisted on the whim of the OS (Parcelable)
	public static ImportResult decryptedData;

	private TextView lblError;

	private byte[] expectedMAC;
	private String keyID;
	private KeyStoreOperations keystore;


	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_decrypt_success);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		if (decryptedData == null)
			finish();

		Resources res = getResources();

		TextView lblTime = findViewById(R.id.lblTime);
		lblTime.setText(res.getString(R.string.decrypt_time, decryptedData.decryptMillis));

		TextView lblMsg1 = findViewById(R.id.lblMsg1);
		lblMsg1.setText(res.getString(R.string.tapToStore, decryptedData.seedName));

		lblError = findViewById(R.id.lblError);
		lblError.setVisibility(View.INVISIBLE);
	}

	private void showError(String msg) {
		lblError.setText(msg);
		lblError.setVisibility(View.VISIBLE);
	}

	@Override
	protected void onStart() {
		super.onStart();

		if (decryptedData == null)
			finish();
	}

	@Override
	protected void onStop() {
		super.onStop();

		//allow GC of sensitive memory
		decryptedData = null;
	}

	public void onClick_btnStore(View v) {
		findViewById(R.id.btnStoreSeed).setEnabled(false);

		Seed seed = decryptedData.seed;

		//Compute the expected test MAC which will be used to verify the integrity of the seed henceforth
		expectedMAC = Util.hmacSha256(seed.bytes, KeyStoreOperations.getTestMessage());

		try {
			keystore = new KeyStoreOperations(getResources());

			keyID = seed.name;
			keystore.installHmacSha256Key(keyID, seed.bytes);

			keystore.requestKeyUnlock(seed.name, this);
			//onActivityResult() will be called next
		} catch (KeyStoreOperationEx ex) {
			showError(ex.getMessage());
		}
	}

	private void afterUnlocked() {
		try {
			byte[] gotMAC = keystore.hmacSha256(keyID, KeyStoreOperations.getTestMessage());

			if (Util.constantTimeCompare(gotMAC, expectedMAC)) {
				startActivity(new Intent(this, WelcomeActivity.class));
				finish();
			}
			else
				showError("Verify failed!");

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
}
