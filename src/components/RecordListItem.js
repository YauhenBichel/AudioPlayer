import React, { memo } from 'react';
import {
  Pressable,
  Text,
  Image
} from 'react-native';
import { audioActiveSrc, audioSrc } from '../Constants';
import { IconButton } from './IconButton';

export const RecordListItem = memo(function RecordListItem({ id, title, selected, onPressItem, onDeleteItem }) {
  const recordColor = selected ? 'gray' : 'white';
  const textColor = selected ? 'orange' : 'gray';
  const recordImageSrc = selected ? audioActiveSrc : audioSrc;

  return (
    <Pressable
      onPress={() => onPressItem(id)}
      style={{
        flexDirection: 'row',
        backgroundColor: recordColor,
        alignItems: 'center',
        padding: 10,
        overflow: 'hidden'
      }}
    >
      <Image
        style={{ width: 25, height: 25, padding: 10 }}
        source={recordImageSrc}
      />
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          flex: 1,
          fontSize: 15,
          color: textColor,
          padding: 10,
        }}
      >
        {title}
      </Text>
      <IconButton
        iconName="trash"
        iconSize={25}
        color="gray"
        onPress={() => onDeleteItem(id)}
        accessibilityLabel={`Delete ${title}`}
      />
    </Pressable>
  );
});
