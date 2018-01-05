package com.calcpass.droidapp;

import android.text.method.LinkMovementMethod;
import android.view.View;
import android.widget.TextView;

/**
 * Misc Android-specific functions.
 */
public class DroidUtil {

	public static void enableTextViewHyperlinks(View aTextView) {
		TextView tv = (TextView)aTextView;

		//enable hyperlinks
		//https://stackoverflow.com/questions/2734270/how-do-i-make-links-in-a-textview-clickable
		tv.setMovementMethod(LinkMovementMethod.getInstance());
	}
}
