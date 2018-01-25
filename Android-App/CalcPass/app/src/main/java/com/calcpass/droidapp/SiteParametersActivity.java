package com.calcpass.droidapp;

import android.content.Context;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ListView;
import android.widget.TextView;

public class SiteParametersActivity extends AppCompatActivity {
	private ListView listView;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_site_parameters);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);


		listView = (ListView)findViewById(R.id.listView);
		listView.setAdapter(new SiteParametersListAdapter(this));

		//Use this?
		//https://developer.android.com/guide/topics/ui/settings.html

		//Otherwise use a ScrollView with nested constraint layout.


	}

}

class SiteParametersListAdapter extends BaseAdapter {
	static final int ITEM_SITENAME = 0;
	static final int ITEM_REVISION = 1;
	static final int ITEM_FORMAT = 2;
	static final int ITEM_USERNAME = 3;
	static final int ITEM_REMEMBER = 4;
	static final int ITEM_CALC_BUTTON = 5;
	static final int ITEM_count_ = 6;

	private LayoutInflater mInflater;
	private Context mContext;

	SiteParametersListAdapter(Context context) {
		//https://www.raywenderlich.com/124438/android-listview-tutorial
		mInflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		mContext = context;


	}


	@Override
	public int getCount() {
		return ITEM_count_;
	}

	@Override
	public Object getItem(int position) {
		return position;
	}

	@Override
	public long getItemId(int position) {
		return position;
	}

	@Override
	public View getView(int position, View convertView, ViewGroup parent) {
		View v;

		switch (position) {
			case ITEM_SITENAME: {
				v = mInflater.inflate(R.layout.siteparam_row_sitename, parent, false);
				TextView sitename = (TextView)v.findViewById(R.id.lblSitename);
				sitename.setText("very long site name");
				break;
			}
			case ITEM_REVISION: {
				v = mInflater.inflate(R.layout.siteparam_row_revision, parent, false);
				break;
			}
			case ITEM_FORMAT: {
				v = mInflater.inflate(R.layout.siteparam_row_format, parent, false);
				break;
			}
			case ITEM_USERNAME: {
				v = mInflater.inflate(R.layout.siteparam_row_username, parent, false);
				break;
			}
			case ITEM_REMEMBER: {
				v = mInflater.inflate(R.layout.siteparam_row_remember, parent, false);
				break;
			}
			case ITEM_CALC_BUTTON: {
				v = mInflater.inflate(R.layout.siteparam_row_calc_button, parent, false);
				break;
			}
			default: {
				//should not happen
				v = new TextView(mContext);
				((TextView)v).setText("UNKNOWN-ITEM #" + position);
				break;
			}

		}

		return v;
	}
}
