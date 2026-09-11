import React from 'react';
import { Pressable } from 'react-native';
import FontAwesome from '@react-native-vector-icons/fontawesome';

export const IconButton = ({ iconName, iconSize = 25, color = 'gray', onPress, accessibilityLabel, style }) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={style}
  >
    <FontAwesome name={iconName} size={iconSize} color={color} />
  </Pressable>
);
