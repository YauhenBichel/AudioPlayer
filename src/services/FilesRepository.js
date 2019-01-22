const RNFS = require('react-native-fs');
import {playlistDirPath} from '../Constants';

export function copyRecordFilesToTemp(records) {
	for (const record of records) {
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
}

export function savePlaylist(playlistName, records) {
	return RNFS.exists(playlistDirPath)
		.then((exists) => {
			if (exists === true) {
				const path = playlistDirPath + "/" + playlistName + ".json";
				RNFS.writeFile(path, JSON.stringify(records), 'utf8')
					.then((success) => {
						return Promise.resolve("ok");
					})
					.catch((err) => {
						console.log(err);
						return Promise.reject(err);
					});
			} else {
				RNFS.mkdir(playlistDirPath)
					.then(() => {
						const path = playlistDirPath + "/" + playlistName + ".json";
						RNFS.writeFile(path, JSON.stringify(records), 'utf8')
							.then((success) => {
								return Promise.resolve("ok");
							})
							.catch((err) => {
								console.log(err);
								return Promise.reject(err);
							});
					})
					.catch((error) => {
						console.log(error);
						return Promise.reject(error);
					})
			}
		})
		.catch((error) => {
			console.log(error);
			return Promise.reject(error);
		});
}

export function deleteAllFiles() {
	RNFS.exists(playlistDirPath)
		.then((exists) => {
			if (exists === true) {
				RNFS.readDir(playlistDirPath)
					.then((result) => {
						
						for (const res of result) {
							RNFS.unlink(res.path)
								.then(() => {
								})
								.catch((error) => {
									console.log("componentWillMount remove error: ", error);
								});
						}
					})
					.catch((err) => {
						console.log(err);
					});
			}
		})
		.catch((error) => {
			console.log(error);
		});
}
