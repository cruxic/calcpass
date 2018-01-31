package com.calcpass.droidapp;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.TextView;

import com.calcpass.Misc;

public class EditWebsiteNameActivity extends AppCompatActivity implements ChooseFromListDialog.Listener {
	private EditText txtSitename;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_edit_website_name);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		txtSitename = findViewById(R.id.txtSitename);

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

	private void handleDone() {

		ChooseFromListDialog.showNewInstance(new String[]{"foo", "bar"}, getSupportFragmentManager());



		/*


		Intent intent = new Intent();
		intent.putExtra("sitename", txtSitename.getText().toString());
		setResult(Activity.RESULT_OK, intent);
		finish();*/
	}

	@Override
	public void onChooseFromListDialog(int chosenIndex) {
		System.out.println("You chose " + chosenIndex);
		//TODO: better if showNewInstance allowed name and ID
		//TODO: need to handle dismiss

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

