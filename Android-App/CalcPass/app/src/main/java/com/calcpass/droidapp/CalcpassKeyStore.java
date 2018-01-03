package com.calcpass.droidapp;

import java.security.KeyStore;
import java.security.KeyStoreException;

/**
 * Abstract operations against the android hardware backed KeyStore
 */
public class CalcpassKeyStore {
    private final KeyStore androidKeyStore;

    public CalcpassKeyStore() {
        try {
            androidKeyStore = KeyStore.getInstance("AndroidKeyStore");
        } catch (KeyStoreException e) {
            throw new RuntimeException(e);
        }


    }

}
