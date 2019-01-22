import React, {Component} from 'react';
import {
	Text,
	Image,
	View
} from 'react-native';
import {audioAlbomActiveSrc} from "../Constants";

export const Header = ({children}) => {
	return (
		<View style={{
			flex: 1, flexDirection: 'row', textAlign: 'center',
			justifyContent: 'center', alignItems: 'center', padding: 10,
			backgroundColor: 'rgba(240,240,240,1)'
		}}>
			<Image style={{width: 30, height: 30, flex: 3, resizeMode: 'contain',
				marginTop: 30, marginRight: 1}}
				   source={audioAlbomActiveSrc}/>
			<Text style={{fontSize: 20, flex: 7,
				marginLeft: 1,
				fontWeight: 'bold',
				paddingTop: 30,
				textAlign: 'left',
				backgroundColor: 'rgba(240,240,240,1)',
				color: 'gray'}}>ClosePlayer</Text>
		</View>
	);
};
