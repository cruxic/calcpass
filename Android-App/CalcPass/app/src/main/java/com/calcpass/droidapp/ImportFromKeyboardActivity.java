package com.calcpass.droidapp;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.text.method.SingleLineTransformationMethod;
import android.widget.EditText;

public class ImportFromKeyboardActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_import_from_keyboard);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        //EditText pwdData = (EditText)findViewById(R.id.pwdData);
        //pwdData.setTransformationMethod(SingleLineTransformationMethod.getInstance());
    }

}
