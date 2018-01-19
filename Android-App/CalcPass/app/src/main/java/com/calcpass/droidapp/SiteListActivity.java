package com.calcpass.droidapp;

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

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_site_list);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		String seedName = getIntent().getStringExtra("seedName");

		setTitle(seedName);

		siteNames = new ArrayList<String>();
		keystore = new KeyStoreOperations(getResources());

		//Setup ListView
		siteList = findViewById(R.id.siteListView);
		ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, siteNames);
		siteList.setAdapter(adapter);
		siteList.setOnItemClickListener(this);


		FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
		fab.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view) {
				Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
						.setAction("Action", null).show();
			}
		});
	}

	@Override
	public void onItemClick(AdapterView<?> adapterView, View view, int position, long id) {
		String seedName = siteNames.get(position);
		System.out.println(seedName);
	}

}
