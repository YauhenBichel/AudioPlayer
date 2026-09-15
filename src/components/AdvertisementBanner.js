import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_UNIT_ID } from '../config';

const adUnitId = __DEV__ ? TestIds.BANNER : (ADMOB_BANNER_UNIT_ID || TestIds.BANNER);

export default function AdvertisementBanner() {
  const [adFailed, setAdFailed] = useState(false);

  const onAdFailedToLoad = (error) => {
    console.log('Ad failed to load:', error);
    setAdFailed(true);
  };

  if (adFailed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={onAdFailedToLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
