package com.calcpass.droidapp;

import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AlertDialog;
import android.support.v4.app.DialogFragment;
import android.support.v4.app.FragmentManager;

import java.util.List;

public class ChooseFromListDialog extends DialogFragment implements DialogInterface.OnClickListener {
	public static void showNewInstance(int requestCode, List<ListOption> choices, FragmentManager v4_fragmentManager) {
		ChooseFromListDialog dlg = new ChooseFromListDialog();

		String[] ids = new String[choices.size()];
		String[] labels = new String[choices.size()];

		int i = 0;
		for (ListOption opt: choices) {
			ids[i] = opt.id;
			labels[i] = opt.label;
			i++;
		}

		//"Member variables vs setArguments in Fragments"
		//https://stackoverflow.com/questions/6677136/member-variables-vs-setarguments-in-fragments#7160253

		Bundle bun = new Bundle();
		bun.putInt("requestCode", requestCode);
		bun.putStringArray("option_ids", ids);
		bun.putStringArray("option_labels", labels);
		dlg.setArguments(bun);

		String tag = dlg.getClass().getSimpleName() + "_req" + requestCode;
		dlg.show(v4_fragmentManager, tag);
		//If you get an "IllegalStateException: Can not perform this action after onSaveInstanceState"
		// then make sure you called super.onActivityResult() before showing the dialog
	}

	@Override
	public Dialog onCreateDialog(Bundle savedInstanceState) {
		super.onCreateDialog(savedInstanceState);

		Bundle bun = getArguments();
		String[] ids = bun.getStringArray("option_ids");
		String[] labels = bun.getStringArray("option_labels");
		//int requestCode = bun.getInt("requestCode");
		if (ids == null || labels == null)
			throw new IllegalArgumentException();

		AlertDialog.Builder builder = new AlertDialog.Builder(getContext());
		builder.setTitle(R.string.domainscope_dialog_title);
		builder.setItems(labels, this);

		return builder.create();
	}

	//Called when a list item is clicked
	public void onClick(DialogInterface dialog, int which) {
		Bundle bun = getArguments();
		String[] ids = bun.getStringArray("option_ids");
		int requestCode = bun.getInt("requestCode");

		Context ctx = getContext();
		if (ctx instanceof OnDialogResult) {
			String chosenId = ids[which];

			Intent data = new Intent();
			data.putExtra("chosenId", chosenId);

			((OnDialogResult)ctx).onDialogResult(requestCode, Activity.RESULT_OK, data);
		}
		else
			throw new RuntimeException("Your Activity does not implement OnDialogResult");

	}
}
