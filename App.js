import React, {Component} from 'react';

import {
	StyleSheet,
	Text,
	View,
	ScrollView,
	AlertIOS,
	YellowBox,
	FlatList,
	ActionSheetIOS
} from 'react-native';
import Sound from 'react-native-sound';
import DocumentPicker from 'react-native-document-picker';
const RNFS = require('react-native-fs');
import {Header} from './src/components/Header';
import {ImageButton} from './src/components/ImageButton';
import {
	playlistDirPath,
	playSrc, repeatPlaylistActiveSrc,
	repeatPlaylistSrc,
	repeatSoundAlwaysSrc,
	repeatSoundOnceSrc,
	stopSrc
} from './src/Constants';

import queueFactory from 'react-native-queue';

import BackgroundTimer from 'react-native-background-timer';
import {copyRecordFilesToTemp, deleteAllFiles} from './src/services/FilesRepository';
import {createSound, soundPlay} from './src/services/SoundService';
import AdvertisementBanner from './src/components/AdvertisementBanner';
import {RecordListItem} from './src/components/RecordListItem';
import {IconButton} from './src/components/IconButtom';
import * as utils from './src/utils';

const jobNameRemoveFiles = 'remove-files';
const jobNameCopyFiles = 'copy-files';
const jobNamePlaySounds = 'play-sounds';

let queue;
let isPlayingFirst = true;

class AppView extends Component {
	
	constructor(props) {
		super(props);
		
		YellowBox.ignoreWarnings([
			'Module RNBackgroundFetch requires',
		]);
		
		Sound.setCategory('Playback', true); // true = mixWithOthers
		
		this.state = {
			queue: null,
			currAudio: null,
			currIndex: 0,
			records: [],
			repeatAll: false,
			isPlaying: false,
			playlistName: ""
		};
		
		// Init queue
		queueFactory().then((q) => {
			queue = q;
			
			queue.addWorker(jobNameCopyFiles, async (id, payload) => {
				for(const record of payload) {
					RNFS.exists(record.url)
						.then((exists) => {
							if (!exists) {
								RNFS.copyFile(record.originalUrl, record.url)
									.catch((error) => {
										console.log("copyRecordFilesToTemp copyFile: ", error);
									});
							}
						})
						.catch((error) => {
							console.log("copyRecordFilesToTemp exists: ", error);
						});
				}
			});
			
			queue.addWorker(jobNameRemoveFiles, async(id, payload) => {
				///console.warn("remove files worker");
			});
			
			queue.addWorker(jobNamePlaySounds, async(id, payload) => {
				this.play();
			});
		});
	}
	
	render() {
		return (
			<View style={styles.container}>
				<View style={{flex: 1.5}}>
					<Header style={styles.title}>ClosePlayer</Header>
				</View>
				<View style={{
					flex: 6, padding: 5,
					alignItems: 'stretch', justifyContext: 'center',
					backgroundColor: "white", borderRadius: 4,
					borderColor: "rgba(240,240,240,1)", borderWidth: 3, margin: 5
				}}>
					
					{this.renderPlaylistHeader()}
					
					<View style={{flex: 7.3, paddingTop: 5, borderColor: "gray", borderRadius: 4, BorderWidth: 1}}>
						<ScrollView style={{flex: 1, paddingTop: 5, paddingBottom: 5}}
									contentContainerStyle={styles.scrollContainer}>
							{this.renderRecordsList()}
						</ScrollView>
					</View>
				</View>
				<View style={{flex: 2}}>
					{this.renderActiveRecordTitleView()}
					{this.renderActiveRecordControlView()}
				</View>
				<View style={{flex: 1}}>
					<AdvertisementBanner/>
				</View>
			</View>
		);
	}
	renderRepeatSound() {
		if(this.getCurrRecord()) {
			
			let repeatIcon = repeatSoundOnceSrc;
			
			if(this.getCurrRecord().repeat === true ) {
				repeatIcon = repeatSoundAlwaysSrc;
			}
			
			return (
				<ImageButton style={{width: 35,
					height: 35,
					borderRadius: 5,
					margin: 10}}
							 imgSrc={repeatIcon}
							 onPress={()=>{
								 return this.repeatSound();
							 }} />
			);
		} else {
			return null;
		}
	}
	renderRepeatAll() {
		
		let playlistRepeat = repeatPlaylistSrc;
		if(this.state.repeatAll) {
			playlistRepeat = repeatPlaylistActiveSrc;
		}
		
		if(this.state.records && this.state.records.length > 0) {
			return (
				<View style={{ flex: 1, flexDirection: 'row',
					alignItems: 'flex-start', paddingLeft: 15,
					justifyContent: 'flex-start'}}>
					<ImageButton style = {{width: 25, height: 25, borderRadius: 5,
						paddingTop: 7, paddingBottom: 7}}
								 imgSrc = {playlistRepeat}
								 onPress = {() => {
									 return this.repeatAll();
								 }}
					/>
				</View>
			);
		} else {
			return null;
		}
	}
	renderRecordsList() {
		
		let keyExtractor = (item, index) => item.id.toString();
		
		let renderItem = ({item}) => {
			return (<RecordListItem
				id={item.id}
				onPressItem={this.onPressPlaylistItem.bind(this)}
				onDeleteItem={this.onDeletePlayListItem.bind(this)}
				selected={this.state.records[this.state.records.indexOf(item)].selected}
				title={item.title}
			/>);
		};
		
		if(this.state.records && this.state.records.length > 0) {
			return (
				<FlatList
					data={this.state.records}
					extraData={this.state}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
				/>
			);
		} else {
			return (
				<View style={{justifyContent:'center',alignItems: 'center'}}>
					<Text style={{
						fontSize: 20,
						paddingTop: 30,
						padding: 20,
						textAlign: 'center',
						color: 'gray'
					}}>No audio</Text>
				</View>
			);
		}
	}
	renderActiveRecordControlView() {
		
		let playBtnSrc = playSrc;
		if (this.state.isPlaying === true) {
			playBtnSrc = stopSrc;
		}
		
		return (
			<View style={{flex: 1, flexDirection: 'row', paddingTop: 10, marginBottom: 20,
				alignItems: 'center', justifyContent: 'center'}}>
				<ImageButton style={{width: 35, height: 35, borderRadius: 5,
					marginLeft: 15, marginRight: 30,
					marginTop: 10, marginBottom: 10}}
							 imgSrc={require("./images/prev.png")}
							 onPress={() => {
								 return this.clickPlayPrev();
							 }}
				/>
				<ImageButton style={{width: 35, height: 35, borderRadius: 5,
					marginLeft: 15, marginRight: 15,
					marginTop: 10, marginBottom: 10}}
							 imgSrc={playBtnSrc}
							 onPress={() => {
								 return this.clickPlay();
							 }}
				/>
				<ImageButton style={{width: 35, height: 35, borderRadius: 5,
					marginLeft: 15, marginRight: 30,
					marginTop: 10, marginBottom: 10}}
							 imgSrc={require("./images/next.png")}
							 onPress={() => {
								 return this.clickPlayNext();
							 }}
				/>
			</View>
		);
	}
	renderActiveRecordTitleView() {
		return (
			<View style={{flex: 1, flexDirection: 'row', paddingTop: 10,
				paddingLeft: 10, paddingRight: 10, paddingBottom: 5,
				alignItems: 'center', justifyContent: 'center'}}>
				<Text style = {{paddingRight: 10, fontSize: 15, color: 'orange'}}>
					{this.getCurrRecordTitle()}
				</Text>
				
				{this.renderRepeatSound()}
			
			</View>
		);
	}
	renderPlaylistHeader() {
		return (
			<View style={{
				flex: 1, flexDirection: 'row', textAlign: 'center',
				justifyContent: 'center', alignItems: 'center', padding: 10,
				borderBottomWidth: 3, borderBottomColor: 'rgba(240,240,240,1)'
			}}>
				<View style={{
					flex: 2, flexDirection: 'row', justifyContent: 'flex-end',
					padding: 5, marginRight: 20, alignItems: 'center'
				}}>
					<ImageButton style={{width: 25, height: 25, borderRadius: 5}}
								 imgSrc={require("./images/add.png")}
								 onPress={() => {
									 return this.addSounds();
								 }}
					/>
				</View>
				<View style={{
					flex: 4, flexDirection: 'row', justifyContent: 'flex-end',
					alignItems: 'center', marginRight: 10
				}}>
					<Text style={{fontSize: 20, textAlign: 'center', color: 'gray'}}>
						Playlist
					</Text>
				</View>
				<View style={{flex: 2.5, flexDirection: 'row', justifyContent: 'flex-end', marginLeft: 5}}>
					{this.renderRepeatAll()}
				</View>
				<View style={{flex: 1.5, flexDirection: 'row', justifyContent: 'flex-end', marginRight: 5}}>
					<IconButton iconName="trash"
								iconSize={25}
								style={{color: "gray"}}
								onPress={() => {
									this.showDeleteAllOptions();
								}} />
				</View>
			</View>
		);
	}
	
	getCurrRecord() {
		if (!this.state.records || this.state.records.length === 0) {
			return null;
		}
		
		if(this.state.currIndex === -1) {
			return null;
		}
		
		return this.state.records[this.state.currIndex];
	}
	getCurrRecordTitle() {
		if (!this.state.records || this.state.records.length === 0) {
			return '';
		}
		
		if(this.state.currIndex === -1) {
			return '';
		}
		
		return this.state.records[this.state.currIndex].title;
	}
	
	createCopyFilesJob() {
		
		//console.warn("createCopyFilesJob");
		
		queue.createJob(
			jobNameCopyFiles,
			{ records: this.state.records },
			{ attempts: 5, timeout: 15000 }, // Retry job on failure up to 5 times. Timeout job in 15 sec (prefetch is probably hanging if it takes that long).
			true // Must pass false as the last param so the queue starts up in the background task instead of immediately.
		);
	}
	createRemoveFilesJob() {
		this.state.queue.createJob(
			jobNameRemoveFiles,
			{ records: this.state.records },
			{ attempts: 5, timeout: 15000 }, // Retry job on failure up to 5 times. Timeout job in 15 sec (prefetch is probably hanging if it takes that long).
			false // Must pass false as the last param so the queue starts up in the background task instead of immediately.
		);
	}
	
	componentWillMount() {
		deleteAllFiles();
	}
	componentDidMount() {
		//BackgroundTask.schedule(); // Schedule the task to run every ~15 min if app is closed.
	}
	
	showDeleteAllOptions() {
		let options = [
			'Delete All',
			'Cancel'
		];
		
		ActionSheetIOS.showActionSheetWithOptions({
			options: options,
			cancelButtonIndex: 1,
			destructiveButtonIndex: 0
		}, (buttonIndex) => {
			if (buttonIndex === 0) {
				this.deleteAll();
			}
		})
	}
	deleteAll() {
		this.stopSound().then(() => {
			this.setState({currIndex: -1});
			this.setNoSelectedRecords();
			this.setState({records: []});
			
			deleteAllFiles();
		});
	}
	
	onPressPlaylistItem(id) {
		let found = this.state.records.find((record) => {
			return record.id === id;
		});
		
		let foundIndex = this.state.records.indexOf(found);
		
		this.setState({currIndex: foundIndex}, () => {
			
			this.setSelectedRecord();
			
			this.setState({isPlaying: true});
			
			this.stopSound()
				.then(() => {
					this.play();
				});
			
			//if (this.state.isPlaying === true) {
			
			//}
		});
	}
	onDeletePlayListItem(id) {
		
		let found = this.state.records.find((record) => {
			return record.id === id;
		});
		
		let foundIndex = this.state.records.indexOf(found);
		
		if(this.state.currIndex === foundIndex && this.state.records.length === 1) {
			this.setState({currIndex: -1});
			this.setNoSelectedRecords();
		} else if(this.state.currIndex === foundIndex && this.state.records.length !== 1) {
			this.setState({currIndex: this.state.currIndex - 1});
		}
		
		RNFS.exists(playlistDirPath)
			.then((exists) => {
				if (exists === true) {
					RNFS.readDir(playlistDirPath)
						.then((result) => {
							
							RNFS.unlink(this.state.records[foundIndex].url)
								.then(() => {
								})
								.catch((error) => {
									console.log("componentWillMount remove error: ", error);
								});
						})
						.catch((err) => {
							console.log(err);
						});
				}
			})
			.catch((error) => {
				console.log(error);
			});
		
		let temp = this.state.records;
		temp.splice(foundIndex, 1);
		
		temp.sort(function(a, b){return a.orderId - b.orderId});
		
		//for(let i = 0; i < temp.length; i++) {
		//	temp[i].id = i;
		//}
		
		this.setState({records: temp});
		if(this.state.currIndex === foundIndex) {
			const shouldPlay = false;
			this.playNext(shouldPlay);
		}
	}
	
	async addSounds() {
		
		// Pick multiple files
		try {
			const results = await DocumentPicker.pickMultiple({
				type: [DocumentPicker.types.audio],
			});
			
			
			const temp = this.state.records == null? [] : this.state.records;
			let id = utils.guid();
			let orderId = temp.length;
			
			for (const res of results) {
				const srcPath = res.uri.substring(7); //.toString("base64")
				const srcUriLastSlashIndex = srcPath.lastIndexOf('/');
				const srcUriBeforeFileName = srcPath.substring(0, srcUriLastSlashIndex+1);
				
				//let newName = new Buffer(res.name).toString("base64");
				const srcPathWithName = srcUriBeforeFileName + res.name;
				//console.warn("createAndPlaySound newPath: ", newPath);
				
				const dotIndex = res.name.lastIndexOf('.');
				const title = res.name.substring(0, dotIndex);
				let newName = "";
				
				for(let i = 0; i < title.length; i++) {
					newName += title.charCodeAt(i);
				}
				
				const ext = res.name.substring(dotIndex);
				id = newName + utils.guid();
				
				// for supporting non-english languages
				let destPath = RNFS.DocumentDirectoryPath + "/" + newName + ext; //.toString("base64")
				
				let record = {
					id: id,
					title: title,
					originalUrl: srcPathWithName,
					url: destPath,
					repeat: false,
					selected: false,
					orderId: orderId
				};
				
				orderId++;
				
				temp.push(record);
			}
			
			this.setState({records: temp}, this.addRecordsStateChanged);
		} catch (err) {
			if (DocumentPicker.isCancel(err)) {
				// User cancelled the picker, exit any dialogs or menus and move on
			} else {
				throw err;
			}
		}
	}
	addRecordsStateChanged() {
		copyRecordFilesToTemp(this.state.records);
		this.setSelectedRecord();
	}
	
	createAndPlaySound(record) {
		return new Promise((resolve, reject) => {
			if (!record) {
				this.setState({isPlaying: false}, this.stopSoundStateChanged);
				return reject("record is null");
			}
			
			let currentAudio;
			
			if (this.state.currAudio && this.state.currAudio.isPlaying()) {
				currentAudio = this.state.currAudio;
				
				setTimeout(() => {
					return soundPlay(currentAudio)
						.then((resp) => {
							return resolve(resp);
						}).catch((error) => {
							return reject(error);
						});
				}, 500);
			}
			else {
				record.originalUrl = record.originalUrl.replace(" ", "-");
				//let newUrl="";
				//for(let i = 0; i < record.originalUrl.length; i++) {
				//	newUrlrecord.originalUrl.charCodeAt()
				//}
				
				const srcUriLastSlashIndex = record.originalUrl.lastIndexOf('/');
				const srcUriBeforeFileName = record.originalUrl.substring(0, srcUriLastSlashIndex + 1);
				
				const dstUriLastSlashIndex = record.url.lastIndexOf('/');
				const dstUriFileName = record.url.substring(dstUriLastSlashIndex + 1);
				
				const resPath = srcUriBeforeFileName + dstUriFileName;
				
				RNFS.exists(resPath)
					.then((exists) => {
						if (exists === false) {
							RNFS.copyFile(record.url, resPath)
								.then(() => {
									setTimeout(() => {
										createSound(resPath)
											.then((resp) => {
												currentAudio = resp;
												this.setState({currAudio: currentAudio});
												this.handleSoundRepeat(record, currentAudio);
											})
											.catch((error) => {
												reject(error);
											});
										
										setTimeout(() => {
											if (!currentAudio) {
												return reject("current audio is null");
											}
											
											return soundPlay(currentAudio)
												.then((resp) => {
													return resolve(resp);
												}).catch((error) => {
													return reject(error);
												});
										}, 500);
										
									}, 500);
								})
								.catch((error) => {
									return reject(error);
								});
						}
						else {
							setTimeout(() => {
								createSound(resPath)
									.then((resp) => {
										currentAudio = resp;
										this.setState({currAudio: currentAudio});
										this.handleSoundRepeat(record, currentAudio);
									})
									.catch((error) => {
										reject(error);
									});
								
								setTimeout(() => {
									if (currentAudio === null) {
										return reject("current audio is null");
									}
									
									return soundPlay(currentAudio)
										.then((resp) => {
											return resolve(resp);
										}).catch((error) => {
											return reject(error);
										});
								}, 500);
								
							}, 500);
						}
					})
					.catch((error) => {
						return reject(error);
					});
			}
		});
	}
	handleSoundRepeat(currentRecord, currentAudio) {
		if (currentRecord.repeat === true) {
			// Loop indefinitely until isStopIconActive() is called
			const looped = currentAudio.setNumberOfLoops(-1);
			this.setState({currAudio: looped});
		} else {
			const once = currentAudio.setNumberOfLoops(0);
			this.setState({currAudio: once});
		}
	}
	play() {
		this.setState({isPlaying: !this.state.isPlaying});
		
		const currRecord = this.getCurrRecord();
		if (!currRecord) {
			return Promise.reject("record is null");
		}
		
		return this.createAndPlaySound(currRecord)
			.then((resp) => {
				this.setState({isPlaying: false}, this.stopSoundStateChanged);
				return Promise.resolve("ok");
			}).catch((error) => {
				this.setState({isPlaying: false}, this.stopSoundStateChanged);
				return Promise.reject(error);
			});
	}
	clickPlay() {
		if(!this.state.records || this.state.records.length === 0) {
			AlertIOS.prompt(
				'No records',
				null,
				null,
				null,
				'default' //Default alert with no inputs
			);
			return;
		}
		
		if (this.state.isPlaying === true) {
			this.stopSound();
		} else {
			
			const shouldPlay = true;
			
			if(isPlayingFirst === true) {
				isPlayingFirst = false;
				BackgroundTimer.start();
				this.play();
			} else {
				setTimeout(()=>{
					this.stopSoundStateChanged(shouldPlay);
				}, 500);
			}
		}
	}
	stopSoundStateChanged(shouldPlay) {
		if(this.state.isPlaying === false &&
			this.state.currIndex !== -1 &&
		this.state.records.length !== 0) {
			setTimeout(() => {
				if(this.state.records[this.state.currIndex].repeat === true ||
					shouldPlay === true) {
					this.play();
				} else if(this.state.repeatAll === true) {
					this.playNext(true);
				} else {
					this.stopSound();
				}
			}, 500);
		}
	}
	stopSound() {
		return new Promise((resolve, reject) => {
			
			this.setState({isPlaying: false});
			
			if (this.state.currAudio != null) {
				return this.state.currAudio.stop(() => {
					this.state.currAudio.release();
					this.setState({currAudio: null});
					
					if(this.state.records.length === 0 || this.state.currIndex === -1) {
						return resolve(true);
					}
					
					if (this.state.records && this.state.records[this.state.currIndex].repeat === true) {
						this.setRepeatSoundOnce();
					}
					
					return resolve(true);
				});
			} else {
				return resolve(true);
			}
		});
	}
	
	playPrev(shouldPlay) {
		this.stopSound()
			.then(() => {
				let currentIndex = 0;
				
				if (this.state.currIndex === 0) {
					currentIndex = this.state.records.length - 1;
				} else {
					currentIndex = this.state.currIndex - 1;
				}
				
				this.setState({currIndex: currentIndex}, () => {
					
					this.setSelectedRecord();
					
					if (this.state.isPlaying === true || shouldPlay === true) {
						return this.play();
					} else {
						return Promise.resolve("ok");
					}
				});
			});
	}
	clickPlayPrev() {
		
		if(!this.state.records || this.state.records.length === 0) {
			AlertIOS.prompt(
				'No records',
				null,
				null,
				null,
				'default' //Default alert with no inputs
			);
			
			return;
		}
		
		let shouldPlay = false;
		//if(this.state.isPlaying) {
		//	shouldPlay = true;
		//}
		
		this.playPrev(shouldPlay);
	}
	playNext(shouldPlay) {
		this.stopSound()
			.then(() => {
				let currentIndex = 0;
				
				if (this.state.currIndex === this.state.records.length - 1) {
					currentIndex = 0;
				} else {
					currentIndex = this.state.currIndex + 1;
				}
				
				this.setState({currIndex: currentIndex}, () => {
					
					this.setSelectedRecord();
					
					if(this.state.isPlaying === true || shouldPlay === true) {
						this.play();
					}
				});
			});
	}
	clickPlayNext() {
		
		if (!this.state.records || this.state.records.length === 0) {
			AlertIOS.prompt(
				'No records',
				null,
				null,
				null,
				'default' //Default alert with no inputs
			);
			
			return;
		}
		
		let shouldPlay = false;
		//if(this.state.isPlaying) {
		//	shouldPlay = true;
		//}
		
		this.playNext(shouldPlay);
	}
	
	repeatAll() {
		this.setState({repeatAll: !this.state.repeatAll});
	}
	repeatSound() {
		
		if(!this.state.records || this.state.records.length === 0) {
			AlertIOS.prompt(
				'No records',
				null,
				null,
				null,
				'default' //Default alert with no inputs
			);
			
			return;
		}
		
		if(this.state.currIndex === -1) {
			return;
		}
		
		if(this.state.records[this.state.currIndex].repeat === false) {
			this.setRepeatSoundAlways();
		}
		else {
			this.setRepeatSoundOnce();
		}
	}
	setSelectedRecord() {
		const records = this.state.records;
		
		if(records.length === 0) {
			return;
		}
		
		for(let i = 0; i < records.length; i++) {
			records[i].selected = false;
		}
		
		if(this.state.currIndex !== -1) {
			records[this.state.currIndex].selected = true;
		}
		
		this.setState({records: records});
	}
	setNoSelectedRecords() {
		const records = this.state.records;
		
		for(let i = 0; i < records.length; i++) {
			records[i].selected = false;
		}
		
		this.setState({records: records});
	}
	setRepeatSoundOnce() {
		if(this.state.records.length === 0) {
			return;
		}
		
		const records = this.state.records;
		if(this.state.currIndex !== -1) {
			records[this.state.currIndex].repeat = false;
		}
		
		this.setState({records: records});
	}
	setRepeatSoundAlways() {
		if(this.state.records.length === 0) {
			return;
		}
		
		const records = this.state.records;
		
		if(this.state.currIndex !== -1) {
			records[this.state.currIndex].repeat = true;
		}
		
		this.setState({records: records});
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	scrollContainer: {},
	title: {
		fontSize: 15,
		paddingTop: 30,
		padding: 20,
		textAlign: 'center',
		backgroundColor: 'rgba(240,240,240,1)',
		color: 'gray'
	},
	button: {
		fontSize: 20,
		backgroundColor: 'white',
		color: 'gray',
		borderRadius: 4,
		borderWidth: 1,
		borderColor: 'gray',
		overflow: 'hidden',
		padding: 7
	}
});

export default AppView;
