import React, {Component} from 'react';
import {
	TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export const IconButton = ({iconName, style, iconSize, onPress}) => (<TouchableOpacity onPress={onPress}>
	<Icon style={style} name={iconName} size={iconSize}/>
</TouchableOpacity>);
