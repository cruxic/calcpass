package com.calcpass.droidapp;

import android.content.Intent;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import com.calcpass.util.Base64Implementation;

import java.util.List;

public class MainActivity extends AppCompatActivity implements AdapterView.OnItemClickListener {

    private ListView seedListView;
    private List<String> seedNames;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //Setup base64 implementation
        if (Base64Implementation.instance == null)
            Base64Implementation.instance = new AndroidBase64Implementation();

        DataStore prefs = new DataStore(getApplicationContext());

        //User must first accept the license
        if (!prefs.hasAcceptedEULA()) {
            startActivity(new Intent(this, EULAActivity.class));
            finish();
            return;
        }

        //If no seeds, prompt user to import one
        seedNames = prefs.getSeedNames();
        if (seedNames.isEmpty()) {
            startActivity(new Intent(this, WelcomeActivity.class));
            finish();
            return;
        }


        setContentView(R.layout.activity_main);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        //Setup seed list view
		// https://www.raywenderlich.com/124438/android-listview-tutorial
        seedListView = findViewById(R.id.seedListView);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, seedNames);
        seedListView.setAdapter(adapter);
        seedListView.setOnItemClickListener(this);

        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                MainActivity.this.startActivity(new Intent(MainActivity.this, SiteParametersActivity.class));
                //Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
                //        .setAction("Action", null).show();
            }
        });
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

	@Override
	public void onItemClick(AdapterView<?> adapterView, View view, int position, long id) {
		String seedName = seedNames.get(position);

		Intent intent = new Intent(this, SiteListActivity.class);
		intent.putExtra("seedName", seedName);
		startActivity(intent);
	}
}
