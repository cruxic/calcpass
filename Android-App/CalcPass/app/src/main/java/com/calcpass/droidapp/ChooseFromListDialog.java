package com.calcpass.droidapp;

import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Bundle;
import android.support.v7.app.AlertDialog;
import android.support.v4.app.DialogFragment;
import android.support.v4.app.FragmentManager;

public class ChooseFromListDialog extends DialogFragment {

	public interface Listener {
		void onChooseFromListDialog(int chosenIndex);
	}

	public static void showNewInstance(String[] choices, FragmentManager v4_fragmentManager) {
		ChooseFromListDialog dlg = new ChooseFromListDialog();

		Bundle bun = new Bundle();
		bun.putStringArray("choices", choices);
		dlg.setArguments(bun);

		String tag = dlg.getClass().getSimpleName();
		dlg.show(v4_fragmentManager, tag);
	}

	@Override
	public Dialog onCreateDialog(Bundle savedInstanceState) {
		super.onCreateDialog(savedInstanceState);

		String[] choices = getArguments().getStringArray("choices");
		if (choices == null)
			throw new NullPointerException();


		AlertDialog.Builder builder = new AlertDialog.Builder(getContext());
		builder.setTitle(R.string.domainscope_dialog_title);
		builder.setItems(choices, new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int which) {
				Context parentActivity = getContext();
				if (parentActivity instanceof Listener) {
					((Listener)parentActivity).onChooseFromListDialog(which);
				}
				else
					throw new RuntimeException("Your activity must implement ChooseFromListDialog.Listener");
			}
		});

		return builder.create();
	}
}
