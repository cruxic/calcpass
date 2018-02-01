package com.calcpass.droidapp;

import android.content.Intent;

/**
 * Same usage as onActivityResult() but for modal DialogFragments
 */
public interface OnDialogResult {
	void onDialogResult(int requestCode, int resultCode, Intent data);
}
