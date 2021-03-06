package com.calcpass.droidapp;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;

public class EULAActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_eula);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
    }

    public void onClickAgree(View v) {
        new DataStore(getApplicationContext()).setAcceptedEULA(true);
        startActivity(new Intent(this, MainActivity.class));
        finish();
    }

    public void onClickQuit(View v) {
        finishAndRemoveTask();
    }


}
