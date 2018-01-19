package com.calcpass.droidapp;

import android.content.Intent;
import android.content.res.Resources;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import java.util.ArrayList;
import java.util.List;

public class SiteListActivity extends AppCompatActivity implements AdapterView.OnItemClickListener {
	private ListView siteList;

	private List<String> siteNames;
	private KeyStoreOperations keystore;
	private String keyID;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_site_list);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		Resources res = getResources();

		String seedName = getIntent().getStringExtra("seedName");
		keyID = seedName;

		setTitle(res.getString(R.string.title_activity_site_list, seedName));

		siteNames = new ArrayList<String>();
		try {
			keystore = new KeyStoreOperations(res);
		} catch (KeyStoreOperationEx ex) {
			//TODO: show error screen
			ex.printStackTrace();
			return;
		}

		if (siteNames.isEmpty()) {
			findViewById(R.id.lblTapAndHold).setVisibility(View.INVISIBLE);
		}

		//Setup ListView
		siteList = findViewById(R.id.siteListView);
		ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, siteNames);
		siteList.setAdapter(adapter);
		siteList.setOnItemClickListener(this);


		FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fabAddSite);
		fab.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view) {
				onClick_fabAddSite();
			}
		});

		try {
			keystore.requestKeyUnlock(keyID, this);
		} catch (KeyStoreOperationEx ex) {
			//TODO: show error screen
			ex.printStackTrace();
			finish();
		}
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		// Check which request we're responding to
		if (requestCode == KeyStoreOperations.UNLOCK_REQUEST_CODE) {
			if (resultCode == RESULT_OK) {
				//afterUnlocked();
				System.out.println("Unlocked");
			}
			else {
				//user denied unlock
				finish();
			}
		}
	}

	@Override
	public void onItemClick(AdapterView<?> adapterView, View view, int position, long id) {
		String seedName = siteNames.get(position);
		System.out.println(seedName);
	}

	private void onClick_fabAddSite() {

	}

}
