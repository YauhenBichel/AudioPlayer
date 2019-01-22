import React, {Component} from 'react';
import {
	Text,
	TouchableOpacity,
	View,
	Image
} from 'react-native';
import Swipeout from 'react-native-swipeout';
import {audioActiveSrc, audioSrc} from '../Constants';

export class RecordListItem extends Component {
	
	constructor(props) {
		super(props);
	}
	
	_onPress = () => {
		this.props.onPressItem(this.props.id);
	};
	
	_onDelete = () => {
		this.props.onDeleteItem(this.props.id);
	};
	
	render() {
		
		let swipeoutBtns = [{
			text: 'Delete',
			backgroundColor: 'red',
			onPress: () => { this._onDelete() }
		}];
		
		const recordColor = this.props.selected === true ? "gray" : "white";
		const textColor = this.props.selected === true ? "orange" : "gray";
		const recordImageSrc = this.props.selected === true ? audioActiveSrc : audioSrc;
		
		return (
			<Swipeout right={swipeoutBtns}>
					<TouchableOpacity onPress={this._onPress}>
						<View style={{
							flexDirection: 'row',
							backgroundColor: recordColor,
							flex: 1,
							textAlign: 'center',
							justifyContent: 'flex-start',
							alignItems: 'center',
							overflow: 'hidden'
						}}>
							<Image style = {{padding: 10, width: 25, height: 25}} source={recordImageSrc}/>
							<Text style = {{padding: 10, fontSize: 15, color: textColor}}>
								{this.props.title}
							</Text>
						</View>
					</TouchableOpacity>
			</Swipeout>
		);
	}
}
