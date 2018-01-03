package com.calcpass.droidapp;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.SparseArray;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.widget.TextView;

import com.google.android.gms.vision.CameraSource;
import com.google.android.gms.vision.Detector;
import com.google.android.gms.vision.barcode.Barcode;
import com.google.android.gms.vision.barcode.BarcodeDetector;

import com.calcpass.Import;
import com.calcpass.ImportEx;

public class ScanQRActivity extends AppCompatActivity implements SurfaceHolder.Callback, Detector.Processor<Barcode> {
    private SurfaceView surfaceView;
    private CameraSource cameraSource;
    private boolean acceptScans;
    private boolean havePermission;

    private static final int CAM_PERM_REQUEST = 1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scan_qr);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        //hide any error
        showError(null);

		surfaceView = findViewById(R.id.surfaceView);

		surfaceView.getHolder().addCallback(this);

		//"Requesting Permissions at Run Time"
		// https://developer.android.com/training/permissions/requesting.html

		havePermission = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
				PackageManager.PERMISSION_GRANTED;

		if (!havePermission)
		{
			//Prompt the user
			ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, CAM_PERM_REQUEST);
			//onRequestPermissionsResult() will be called next
		}
    }

	@Override
	public void onRequestPermissionsResult(int requestCode,
										   String permissions[], int[] grantResults) {
		if (requestCode == CAM_PERM_REQUEST) {
			boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
			if (granted) {
				havePermission = true;
				setupScanner();
			}
			else
				finish();
		}
	}

	@Override
	protected void onRestart() {
		super.onRestart();

		if (havePermission)
			setupScanner();
	}

	@Override
	protected void onStop() {
		super.onStop();
		acceptScans = false;

		if (cameraSource != null) {
			//"Stops the camera and releases the resources of the camera and underlying detector."
			cameraSource.release();
			cameraSource = null;
		}
	}

	//here: onStop call BarcodeDetector.release()

    private void showError(String msg) {
    	final TextView lblErr = findViewById(R.id.lblErr);
    	if (msg != null) {
			lblErr.setText(msg);
			lblErr.setVisibility(View.VISIBLE);

			//Erase after 4s
			lblErr.postDelayed(new Runnable() {
				@Override
				public void run() {
					if (acceptScans)
						lblErr.setVisibility(View.INVISIBLE);
				}
			}, 4000);

		} else {
			lblErr.setVisibility(View.INVISIBLE);
		}

	}

    //Called in the UI thread when a QR was scanned
    private void processScannedCode(String qrData) {
    	if (!acceptScans)
    		return;  //ignore it

		DataToImport dti = new DataToImport();

    	try {
    		//pass null decryption key to verify only
			dti.metaData = Import.ImportFromQRCode(qrData, null, null);

			//Ignore any further scans
			acceptScans = false;

			dti.qrData = qrData;

			//Pass statically to avoid Parcelable limitation or unintentional persistence to disk
			DecryptionPasswordActivity.dataToImport = dti;

			startActivity(new Intent(this, DecryptionPasswordActivity.class));
			finish();
		}
		catch (ImportEx ix) {
    		showError(ix.getMessage());
		}
	}

	private void setupScanner() {
		BarcodeDetector detector =
				new BarcodeDetector.Builder(this)
						.setBarcodeFormats(Barcode.QR_CODE)
						.build();

		CameraSource camSrc = new CameraSource
				.Builder(this, detector)
				.setRequestedPreviewSize(320, 320)
				.build();


		try {
			//"Opens the camera and starts sending preview frames to the underlying detector"
			camSrc.start(surfaceView.getHolder());
		} catch (Exception ex) {
			camSrc.release();
			showError(ex.toString());
			return;
		}
		//java.lang.RuntimeException: Fail to connect to camera service

		detector.setProcessor(this);
		acceptScans = true;
	}

	@Override
	public void surfaceCreated(SurfaceHolder surfaceHolder) {
    	if (havePermission)
    		setupScanner();
	}

	@Override
	public void surfaceChanged(SurfaceHolder surfaceHolder, int i, int i1, int i2) {

	}

	@Override
	public void surfaceDestroyed(SurfaceHolder surfaceHolder) {
    	if (cameraSource != null) {
			cameraSource.stop();
			cameraSource = null;
		}
	}

	/**
	 * Detector.Processor.release()
	 * */
	@Override
	public void release() {
    	//Nothing necessary
	}

	/**
	 * Detector.Processor.receiveDetections()
	 * */
	@Override
	public void receiveDetections(Detector.Detections<Barcode> detections) {
		final SparseArray<Barcode> barcodes = detections.getDetectedItems();

		if (barcodes.size() > 0) {
			View v = findViewById(R.id.surfaceView);
			v.post(new Runnable() {
				public void run() {
					processScannedCode(barcodes.valueAt(0).displayValue);
				}
			});
		}

	}
}
