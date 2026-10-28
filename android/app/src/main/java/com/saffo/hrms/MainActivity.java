package com.saffo.hrms;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.location.LocationManager;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private static final int LOCATION_PERMISSION_REQUEST = 1001;
    private boolean askedLocationPermission;
    private boolean locationPromptVisible;
    private int safeTopCssPx;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FileOpenPlugin.class);
        setTheme(R.style.AppTheme_NoActionBar);
        super.onCreate(savedInstanceState);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setStatusBarColor(Color.BLACK);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setAppearanceLightStatusBars(false);

        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            measureSafeTop();
            return insets;
        });
        ViewCompat.requestApplyInsets(content);

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addOnLayoutChangeListener(
                (v, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> measureSafeTop()
            );
            getBridge().addWebViewListener(new WebViewListener() {
                @Override
                public void onPageLoaded(WebView webView) {
                    webView.post(() -> measureSafeTop());
                }
            });
        }
    }

    /**
     * Pad the header only when this phone draws the status bar or camera cutout
     * over the WebView. Phones that already sit the page below the status bar
     * get 0, so their header stays the same height.
     */
    private void measureSafeTop() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(webView);
        if (insets == null) {
            return;
        }
        int coveredPx = insets.getInsets(
            WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()
        ).top;
        int[] location = new int[2];
        webView.getLocationOnScreen(location);
        int overlapPx = Math.max(0, coveredPx - location[1]);
        float density = getResources().getDisplayMetrics().density;
        int cssPx = density > 0 ? Math.round(overlapPx / density) : 0;
        if (cssPx == safeTopCssPx) {
            return;
        }
        safeTopCssPx = cssPx;
        pushSafeTop();
    }

    private void pushSafeTop() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        String js = "document.documentElement.style.setProperty('--safe-top','" + safeTopCssPx + "px')";
        getBridge().getWebView().post(() -> {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(js, null);
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        handleLocationFlow();
    }

    private boolean isPhoneLocationOn() {
        LocationManager manager = (LocationManager) getSystemService(LOCATION_SERVICE);
        return manager != null && manager.isLocationEnabled();
    }

    private void handleLocationFlow() {
        if (locationPromptVisible) {
            return;
        }
        if (!isPhoneLocationOn()) {
            showTurnOnLocationDialog();
            return;
        }
        requestLocationPermissionIfNeeded();
    }

    private void showTurnOnLocationDialog() {
        if (locationPromptVisible || isFinishing()) {
            return;
        }
        locationPromptVisible = true;
        new AlertDialog.Builder(this)
            .setCancelable(false)
            .setTitle("Location required")
            .setMessage("Location is required for attendance. Please turn on Location.")
            .setPositiveButton("Turn on Location", (dialog, which) -> {
                dialog.dismiss();
                openPhoneLocationSwitch();
            })
        .setOnDismissListener(dialog -> locationPromptVisible = false)
        .show();
    }

    /** Location settings page crashes on this Realme phone. Open the switch panel only. */
    private void openPhoneLocationSwitch() {
        try {
            startActivity(new Intent("android.settings.panel.action.LOCATION"));
        } catch (Exception ignored) {
            startActivity(new Intent(Settings.ACTION_SETTINGS));
        }
    }

    private void requestLocationPermissionIfNeeded() {
        if (!isPhoneLocationOn() || askedLocationPermission) {
            return;
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
            return;
        }
        askedLocationPermission = true;
        ActivityCompat.requestPermissions(
            this,
            new String[] {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            },
            LOCATION_PERMISSION_REQUEST
        );
    }
}
