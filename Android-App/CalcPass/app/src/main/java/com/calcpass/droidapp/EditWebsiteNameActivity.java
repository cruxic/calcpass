package com.calcpass.droidapp;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.NavUtils;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.KeyEvent;
import android.view.MenuItem;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.TextView;

import com.calcpass.Misc;

public class EditWebsiteNameActivity extends AppCompatActivity {
	private EditText txtSitename;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_edit_website_name);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		getSupportActionBar().setDisplayHomeAsUpEnabled(true);


		txtSitename = findViewById(R.id.txtSitename);
		Intent intent = getIntent();
		String sitename = intent.getStringExtra("sitename");
		if (sitename != null)
			txtSitename.setText(sitename);

		txtSitename.setOnEditorActionListener(new TextView.OnEditorActionListener() {
			@Override
			public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
				if (actionId == EditorInfo.IME_ACTION_DONE) {
					handleDone();
					return true;
				}

				return false;
			}
		});
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		System.out.println("you options item" + item.getItemId());

		/*
		switch (item.getItemId()) {
			// Respond to the action bar's Up/Home button
			case android.R.id.home:
				NavUtils.navigateUpFromSameTask(this);
				return true;
		}*/

		return super.onOptionsItemSelected(item);
	}

	private void handleDone() {
		String sitename = txtSitename.getText().toString();

		//trim spaces and for lower case
		sitename = sitename.trim().toLowerCase();

		Intent intent = new Intent();
		intent.putExtra("sitename", sitename);
		setResult(Activity.RESULT_OK, intent);
		finish();
	}


	public void onClick_btnPaste(View v) {
		String clip = getClipboardText();
		if (clip == null)
			clip = "";

		//Trim white
		clip = clip.trim();

		//Try parse a valid URL
		String[] schemeAndHost = Misc.getURLSchemeAndHost(clip.toLowerCase());
		if (schemeAndHost != null) {

			String scheme = schemeAndHost[0];
			String host = schemeAndHost[1];

			if (scheme.equals("http")) {
				//TODO: show warning about insecure HTTP
			}

			txtSitename.setText(host);
		}
		else {
			//Not a URL.  Use verbatim
			txtSitename.setText(clip);
		}
	}

	private String getClipboardText() {
		ClipboardManager cbm = (ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
		if (cbm != null && cbm.hasPrimaryClip()) {
			ClipData cpd = cbm.getPrimaryClip();
			if (cpd.getItemCount() > 0) {
				return cpd.getItemAt(0).getText().toString();
			}
		}

		return null;
	}



}

