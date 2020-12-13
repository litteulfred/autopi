// insertion des librairies
var	_ = require('lodash'),
	fs = require('fs'),
	child_process = require('child_process'),
	glb = require('globalAutoradio'),
    ini = require('ini');

/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8');
 
//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);

fs.unlink('init', function() {
	
	if (config.initmulti.verbose) {
		console.log(glb.Time() +' [INITMULTI]\t suppression du flag');
	}

});

var io = require('socket.io').listen('8125');
io.sockets.on('connection', function (socket) {

	console.log(glb.Time() +' [INITMULTI]\t  connexion IHM client')

	/* ----------------------------------------------------- */
	/* modification des répertoire                           */
	/* ----------------------------------------------------- */
	socket.emit('PROG', 'rplNomFic');
	socket.emit('MSG', 'transformation des répertoires');
	var rplNomFic = child_process.exec('sudo /bin/bash ./multimedia/rplNomFic.sh');
	rplNomFic.stdout.on('data', function (data) {

		if (config.initmulti.verbose) {
			console.log(glb.Time() +' [INITMULTI]\t rplNomFic : '+data);
		}

	});
	rplNomFic.stderr.on('data', function (data) {

		if (config.initmulti.verbose) {
			console.log(glb.Time() +' [INITMULTI]\t rplNomFic ERROR : '+data);
		}
		socket.emit('MSG', 'ERROR transformation des répertoires... exit 1');
		process.exit(1);

	});
	rplNomFic.on('close', function() {

		if (config.initmulti.verbose) {
			console.log(glb.Time() +' [INITMULTI]\t rplNomFic CLOSE, creation BDD');
		}

		/* ----------------------------------------------------- */
		/* creation BDD + chargement equalizer                   */
		/* ----------------------------------------------------- */
		socket.emit('PROG', 'createDB');
		socket.emit('MSG', 'creation base de données');
		//var createDB = child_process.exec('mysql --user='+config.database.user+' --password='+config.database.password+' --host='+config.database.host+' < ./multimedia/autoDB.sql');
		var createDB = child_process.exec('psql -U postgres -w -h 127.0.0.1 db_media < ./sql/create.autoDB.sql');
		createDB.stdout.on('data', function (data) {

			if (config.initmulti.verbose) {
				console.log(glb.Time() +' [INITMULTI]\t createDB : '+data);
			}

		});
		createDB.stderr.on('data', function (data) {

			if (config.initmulti.verbose) {
				console.log(glb.Time() +' [INITMULTI]\t createDB ERROR : '+data);
			}
		
//			if ( data.indeOF('NOTICE') != 0 ) {
//				socket.emit('MSG', 'ERROR creation base de données... exit 1');
//				console.log('ICI');
//				process.exit(1);
//			}

		});
		createDB.on('close', function() {

			//var equaDB = child_process.exec('mysql --user='+config.database.user+' --password='+config.database.password+' --host='+config.database.host+' '+config.database.database+' < ./multimedia/equalizer.sql');
			var equaDB = child_process.exec('psql -U postgres -w -h 127.0.0.1 db_media < ./multimedia/equalizer.sql');
			equaDB.stdout.on('data', function (data) {

				if (config.initmulti.verbose) {
					console.log(glb.Time() +' [INITMULTI]\t equaDB : '+data);
				}

			});
			equaDB.stderr.on('data', function (data) {

				if (config.initmulti.verbose) {
					console.log(glb.Time() +' [INITMULTI]\t equaDB ERROR : '+data);
				}
		
				socket.emit('MSG', 'ERROR chargement equalizer... exit 1');
				process.exit(1);

			});
			if (config.initmulti.verbose) {
				console.log(glb.Time() +' [INITMULTI]\t createDB CLOSE, recherche MUSIC');
			}
		
			/* ----------------------------------------------------- */
			/* chargement des media                                  */
			/* ----------------------------------------------------- */
			socket.emit('PROG', 'majMedia');
			socket.emit('MSG', 'Mise à jour bibliothèque multimedia');
			var majMedia = child_process.exec('python ./multimedia/MajMedia.py');
			majMedia.stdout.on('data', function (data) {

				if (config.initmulti.verbose) {
					console.log(glb.Time() +' [INITMULTI]\t majMedia : '+data);
				}

			});
			majMedia.stderr.on('data', function (data) {

				if (config.initmulti.verbose) {
					console.log(glb.Time() +' [INITMULTI]\t majMedia ERROR : '+data);
				}
		
				socket.emit('MSG', 'ERROR mise à jour multimedia... exit 1');
				process.exit(1);

			});
			majMedia.on('close', function() {

				if (config.initmulti.verbose) {
					console.log(glb.Time() +' [INITMULTI]\t majMedia CLOSE, majCover');
				}
			
				/* ----------------------------------------------------- */
				/* maj des covers                                        */
				/* ----------------------------------------------------- */
				socket.emit('PROG', 'majCover');
				socket.emit('MSG', 'Mise à jour des covers');
				//var majCover = child_process.exec('sh ./multimedia/MajCover.sh');
				var majCover = child_process.exec('sh ./multimedia/MajCover.sh');
				majCover.stdout.on('data', function (data) {

					if (config.initmulti.verbose) {
						console.log(glb.Time() +' [INITMULTI]\t majCover : '+data);
					}

				});
				majCover.stderr.on('data', function (data) {

					if (config.initmulti.verbose) {
						console.log(glb.Time() +' [INITMULTI]\t majCover ERROR : '+data);
					}
		
					socket.emit('MSG', 'ERROR mise à jour des covers... exit 1');
					process.exit(1);

				});
				majCover.on('close', function() {

					if (config.initmulti.verbose) {
						console.log(glb.Time() +' [INITMULTI]\t majCover CLOSE, MajConsole');
					}
				
					/* ----------------------------------------------------- */
					/* maj des jeux                                          */
					/* ----------------------------------------------------- */
					socket.emit('PROG', 'majConsole');
					socket.emit('MSG', 'Mise à jour des jeux');
					var MajConsole = child_process.exec('python ./multimedia/MajConsole.py');
					MajConsole.stdout.on('data', function (data) {

						if (config.initmulti.verbose) {
							console.log(glb.Time() +' [INITMULTI]\t MajConsole : '+data);
						}

					});
					MajConsole.stderr.on('data', function (data) {

						if (config.initmulti.verbose) {
							console.log(glb.Time() +' [INITMULTI]\t MajConsole ERROR : '+data);
						}
		
						socket.emit('MSG', 'ERROR mise à jour des jeux... exit 1');
						process.exit(1);

					});
					MajConsole.on('close', function() {

						if (config.initmulti.verbose) {
							console.log(glb.Time() +' [INITMULTI]\t MajConsole CLOSE');
						}
					
						/* ----------------------------------------------------- */
						/* maj des photos                                        */
						/* ----------------------------------------------------- */
						socket.emit('PROG', 'majPhotos');
						socket.emit('MSG', 'Mise à jour des photos');
						var MajPhotos = child_process.exec('python ./multimedia/MajPhotos.py');
						MajPhotos.stdout.on('data', function (data) {

							if (config.initmulti.verbose) {
								console.log(glb.Time() +' [INITMULTI]\t MajPhotos : '+data);
							}

						});
						MajPhotos.stderr.on('data', function (data) {

							if (config.initmulti.verbose) {
								console.log(glb.Time() +' [INITMULTI]\t MajPhotos ERROR : '+data);
							}
		
							socket.emit('MSG', 'ERROR mise à jour des photos... exit 1');
							process.exit(1);

						});
						MajPhotos.on('close', function() {

							if (config.initmulti.verbose) {
								console.log(glb.Time() +' [INITMULTI]\t MajPhotos CLOSE');
							}
							
							/* ----------------------------------------------------- */
							/* relance multimedia                                    */
							/* ----------------------------------------------------- */
							console.log('INFO '+glb.Time() +' [INITMULTI]\t restart des applications');
		
							var restart = child_process.exec('sh ./system/restart.sh');
							restart.stdout.on('data', function (data) {
								console.log('INFO '+glb.Time()+' RESTART '+data);
							});
							restart.stderr.on('data', function (data) {
								console.log('ERROR '+glb.Time()+' RESTART '+data);
							});
							
						});
					
					});
				
				});	
			
			});
		
		});
	});
});
