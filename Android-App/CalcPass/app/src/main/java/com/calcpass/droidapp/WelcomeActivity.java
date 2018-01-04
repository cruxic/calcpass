package com.calcpass.droidapp;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.text.method.LinkMovementMethod;
import android.view.View;
import android.widget.TextView;

public class WelcomeActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_welcome);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);


        //enable hyperlinks
        //https://stackoverflow.com/questions/2734270/how-do-i-make-links-in-a-textview-clickable
        TextView message1 = findViewById(R.id.message1);
        message1.setMovementMethod(LinkMovementMethod.getInstance());

    }

    public void onClickImport(View v) {
        startActivity(new Intent(this, TestKeyStoreActivity.class));
    }

}
