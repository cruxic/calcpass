package com.calcpass.droidapp;

import android.content.res.Resources;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.TextView;

import com.calcpass.ImportResult;

public class DecryptSuccessActivity extends AppCompatActivity {

	//Data is passed static because I fear Intent extras could be persisted on the whim of the OS (Parcelable)
	public static ImportResult decryptedData;


	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_decrypt_success);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		if (decryptedData == null)
			finish();

		Resources res = getResources();

		String title = res.getString(R.string.decrypt_success, decryptedData.seedName);
		setTitle(title);

		TextView lblTime = findViewById(R.id.lblTime);
		lblTime.setText(res.getString(R.string.decrypt_time, decryptedData.decryptMillis));

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

	}
}
