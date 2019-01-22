package com.audioplayer;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.oblador.vectoricons.VectorIconsPackage;
import com.sbugert.rnadmob.RNAdMobPackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.transistorsoft.rnbackgroundfetch.RNBackgroundFetchPackage;
import com.jamesisaac.rnbackgroundtask.BackgroundTaskPackage;
import io.realm.react.RealmReactPackage;
import com.rnfs.RNFSPackage;
import com.reactnativedocumentpicker.ReactNativeDocumentPicker;
import com.zmxv.RNSound.RNSoundPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new VectorIconsPackage(),
            new RNAdMobPackage(),
            new BackgroundTimerPackage(),
            new RNBackgroundFetchPackage(),
            new BackgroundTaskPackage(),
            new RealmReactPackage(),
            new RNFSPackage(),
            new ReactNativeDocumentPicker(),
            new RNSoundPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
