import React, {Component} from 'react';
import {
	Text,
	TouchableOpacity,
} from 'react-native';

export const Button = ({title, onPress, style}) => (<TouchableOpacity onPress={onPress}>
	<Text style={style}>{title}</Text>
</TouchableOpacity>);

