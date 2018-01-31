package com.calcpass.droidapp;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.ListView;
import android.widget.Switch;
import android.widget.TextView;

public class SiteParametersActivity extends AppCompatActivity  implements AdapterView.OnItemClickListener {
	private ListView listView;
	private SiteParametersListAdapter listAdapter;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_site_parameters);
		Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
		setSupportActionBar(toolbar);

		listView = (ListView)findViewById(R.id.listView);
		listAdapter = new SiteParametersListAdapter(this);
		listView.setAdapter(listAdapter);
		listView.setOnItemClickListener(this);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		if (resultCode == Activity.RESULT_OK) {
			switch (requestCode) {
				case ParamType.SITENAME: {
					apply_SITENAME(data.getStringExtra("sitename"));
					break;
				}
			}
		}
	}

	private void apply_SITENAME(String newSitename) {
		TextView lblSitename = findViewById(R.id.lblSitename);
		lblSitename.setText(newSitename);
	}

	@Override
	public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
		//id is one of ParamType.*
		int paramType = (int)id;
		switch (paramType) {
			case ParamType.TYPE: {
				break;
			}
			case ParamType.SITENAME: {
				startActivityForResult(new Intent(this, EditWebsiteNameActivity.class), paramType);
				break;
			}
			case ParamType.REVISION: {
				break;
			}
			case ParamType.FORMAT: {
				break;
			}
			case ParamType.USERNAME: {
				break;
			}
			case ParamType.REMEMBER: {
				Switch switchRemember = findViewById(R.id.switchRemember);
				switchRemember.setChecked(!switchRemember.isChecked());
				break;
			}
			case ParamType.CALC_BUTTON: {
				break;
			}
			default: {
				//should not happen
				break;
			}	
		}
		
		
	}
}

class ParamType {
	static final int TYPE = 0;
	static final int SITENAME = 1;
	static final int REVISION = 2;
	static final int FORMAT = 3;
	static final int USERNAME = 4;
	static final int REMEMBER = 5;
	static final int CALC_BUTTON = 6;
	static final int _count_ = 7;
}

class SiteParametersListAdapter extends BaseAdapter {


	private LayoutInflater mInflater;
	private Context mContext;

	private View[] loadedViews;

	SiteParametersListAdapter(Context context) {
		//https://www.raywenderlich.com/124438/android-listview-tutorial
		mInflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		mContext = context;
		loadedViews = new View[ParamType._count_];
	}


	@Override
	public int getCount() {
		return ParamType._count_;
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

		if (loadedViews[position] != null)
			return loadedViews[position];

		switch (position) {
			case ParamType.TYPE: {
				v = mInflater.inflate(R.layout.siteparam_row_type, parent, false);
				break;
			}
			case ParamType.SITENAME: {
				v = mInflater.inflate(R.layout.siteparam_row_sitename, parent, false);
				break;
			}
			case ParamType.REVISION: {
				v = mInflater.inflate(R.layout.siteparam_row_revision, parent, false);
				break;
			}
			case ParamType.FORMAT: {
				v = mInflater.inflate(R.layout.siteparam_row_format, parent, false);
				break;
			}
			case ParamType.USERNAME: {
				v = mInflater.inflate(R.layout.siteparam_row_username, parent, false);
				break;
			}
			case ParamType.REMEMBER: {
				v = mInflater.inflate(R.layout.siteparam_row_remember, parent, false);
				break;
			}
			case ParamType.CALC_BUTTON: {
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

		loadedViews[position] = v;

		return v;
	}
}
