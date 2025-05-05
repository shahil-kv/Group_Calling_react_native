package com.yourapp;

import android.content.Intent;
import android.net.Uri;
import android.app.Activity;
import android.telecom.TelecomManager;
import android.content.Context;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class CallModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private TelephonyManager telephonyManager;
    private PhoneStateListener phoneStateListener;
    private boolean isListening = false;

    public CallModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        setupPhoneStateListener();
    }

    private void setupPhoneStateListener() {
        telephonyManager = (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);
        phoneStateListener = new PhoneStateListener() {
            @Override
            public void onCallStateChanged(int state, String phoneNumber) {
                WritableMap params = Arguments.createMap();
                
                switch (state) {
                    case TelephonyManager.CALL_STATE_IDLE:
                        params.putString("state", "idle");
                        sendEvent("callStateChanged", params);
                        break;
                    case TelephonyManager.CALL_STATE_RINGING:
                        params.putString("state", "ringing");
                        sendEvent("callStateChanged", params);
                        break;
                    case TelephonyManager.CALL_STATE_OFFHOOK:
                        params.putString("state", "connected");
                        sendEvent("callStateChanged", params);
                        break;
                }
            }
        };
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    @Override
    public String getName() {
        return "CallModule";
    }

    @ReactMethod
    public void makeCall(String phoneNumber, Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity != null) {
                // Start listening to phone state
                if (!isListening) {
                    telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE);
                    isListening = true;
                }

                // Create the call intent
                Intent intent = new Intent(Intent.ACTION_CALL);
                intent.setData(Uri.parse("tel:" + phoneNumber));
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                
                // Start the call directly
                currentActivity.startActivity(intent);
                promise.resolve(true);
            } else {
                promise.reject("ACTIVITY_ERROR", "No activity available");
            }
        } catch (Exception e) {
            promise.reject("CALL_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void endCall(Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity != null) {
                // Get the TelecomManager
                TelecomManager telecomManager = (TelecomManager) reactContext.getSystemService(Context.TELECOM_SERVICE);
                
                // End the call directly
                if (telecomManager != null) {
                    telecomManager.endCall();
                }

                // Stop listening to phone state
                if (isListening) {
                    telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE);
                    isListening = false;
                }

                promise.resolve(true);
            } else {
                promise.reject("ACTIVITY_ERROR", "No activity available");
            }
        } catch (Exception e) {
            promise.reject("CALL_ERROR", e.getMessage());
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (isListening) {
            telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE);
            isListening = false;
        }
    }
} 