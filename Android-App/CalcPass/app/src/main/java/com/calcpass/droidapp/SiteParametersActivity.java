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
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.ListView;
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

		//Use this?
		//https://developer.android.com/guide/topics/ui/settings.html

		//Otherwise use a ScrollView with nested constraint layout.


	}

	@Override
	public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
		//id is one of ParamType.*
		int paramType = (int)id;
		switch (paramType) {
			case ParamType.SITENAME: {
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
	static final int SITENAME = 0;
	static final int REVISION = 1;
	static final int FORMAT = 2;
	static final int USERNAME = 3;
	static final int REMEMBER = 4;
	static final int CALC_BUTTON = 5;
	static final int _count_ = 6;	
}

class SiteParametersListAdapter extends BaseAdapter {


	private LayoutInflater mInflater;
	private Context mContext;

	SiteParametersListAdapter(Context context) {
		//https://www.raywenderlich.com/124438/android-listview-tutorial
		mInflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		mContext = context;
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

		switch (position) {
			case ParamType.SITENAME: {
				v = mInflater.inflate(R.layout.siteparam_row_sitename, parent, false);
				TextView sitename = (TextView)v.findViewById(R.id.lblSitename);
				sitename.setText("very long site name");
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

		return v;
	}
}
