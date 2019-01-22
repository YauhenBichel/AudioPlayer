import Sound from 'react-native-sound';

export function createSound(soundPath) {
	return new Promise((resolve, reject) => {
		let currentAudio = new Sound(soundPath, '', (error) => {
			if (error) {
				currentAudio.release();
				currentAudio = null;
				return reject(error);
			}
		});
		
		return resolve(currentAudio);
	});
}

export function soundPlay(currentAudio) {
	return new Promise((resolve, reject) => {
		currentAudio.play((success) => {
			if (success) {
				currentAudio.stop(() => {
					return resolve(success);
				});
			} else {
				currentAudio.stop(() => {
					currentAudio.release();
					return reject(success);
				});
			}
		});
	});
}
