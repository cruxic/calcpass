package com.calcpass.droidapp;

import com.calcpass.PassFmt;

public class PasswordEntry {
	public static final String TYPE_CALCULATED = "CALCULATED";
	public static final String TYPE_STORED = "STORED";

	public String type;
	public String sitename;
	public int revision;
	public PassFmt format;
	public String username;

	public PasswordEntry() {
		type = TYPE_CALCULATED;
	}


/*
* 	static final int TYPE = 0;
	static final int SITENAME = 1;
	static final int REVISION = 2;
	static final int FORMAT = 3;
	static final int USERNAME = 4;
	static final int REMEMBER = 5;
	static final int CALC_BUTTON = 6;
	static final int _count_ = 7;
* */
}
