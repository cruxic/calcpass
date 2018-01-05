package com.calcpass.droidapp;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;

public class ImportSeedActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_import_seed);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        DroidUtil.enableTextViewHyperlinks(findViewById(R.id.lblMsg1));
    }

    public void onClickFromQR(View v) {
        startActivity(new Intent(this, ScanQRActivity.class));
    }

    public void onClickFromKeyboard(View v) {
        startActivity(new Intent(this, ImportFromKeyboardActivity.class));
    }


}
