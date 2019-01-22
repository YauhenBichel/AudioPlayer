import React, {Component} from 'react';
import {
	View
} from 'react-native';
import {Header} from './Header';

export const Record = ({title, style}) => (<View style={style}>
	<Header style={{flex: 1}}>{title}</Header>
</View>);
