import React, {Component} from 'react';
import {
	Image,
	TouchableOpacity
} from 'react-native';

export const ImageButton = ({imgSrc, style, onPress}) => (<TouchableOpacity onPress={onPress}>
	<Image style={[style, {resizeMode: 'contain'}]} source={imgSrc}/>
</TouchableOpacity>);
