import React, {Component} from  'react';
import {View} from 'react-native';
import {AdMobBanner} from 'react-native-admob';

export default class AdvertisementBanner extends Component {
	constructor(props) {
		super(props);
	}
	
	bannerErrorHandler = (error) => {
		console.log(error);
	};
	
	render() {
		return (
			<View style={{flex: 1}}>
				<AdMobBanner
					adSize="fullBanner"
					adUnitID='ca-app-pub-number'
					onAdFailedToLoad={this.bannerErrorHandler}
					testDevices={[AdMobBanner.simulatorId]}
				/>
			</View>
		);
	}
}
