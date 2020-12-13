// insertion des librairies
var	_ = require('lodash'),
	fs = require('fs'),
	child_process = require('child_process'),
	glb = require('globalAutoradio'),
	Media = require('../lib/libmedia.js'),
	mpv = require('node-mpv'),
    ini = require('ini');

// mis en place des modes options globales
var defaults = {
    tempsMorceau: '0',
    verbose: true,
    debug: false,
    tireencours: ''
};
options = _.defaults(defaults);

/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8');
 
//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);


/* ----------------------------------------------------- */
/* serveur SOCKET                                        */
/* ----------------------------------------------------- */
if (config.multimedia.verbose) {
	console.log(glb.Time() +' [MULTIMEDIA]\t Activation du serveur SOCKET');
} 
var io = require('socket.io').listen('8123');
io.sockets.on('connection', function (socket) {
    
    console.log(glb.Time() +' [MULTIMEDIA]\t Un client est connecté !');

	// activation mpv
    var mpvPlayer = '';
    function startmpv() {
	    mpvPlayer = new mpv({
		    "audio_only": true,
		    "binary": null,
		    "debug": false,
		    "ipcCommand": null,   
		    "socket": "./node-mpv.sock", // UNIX
		    "time_update": 1,
		    "verbose": false,
	    });
     
        // ----------------------------------------------------- */
        //           gestion des événements MPV                  */
        // ----------------------------------------------------- */
        // évènement FIN DU MORCEAU + passage au suivant
        mpvPlayer.on('stopped', function() {
    
            if (config.multimedia.verbose) {
                console.log(glb.Time() + ' [MULTIMEDIA]\t fin du morceau, passage au suivant');
            }
            nextTitle();
        });
    
        // évènement TIME POSITION
        mpvPlayer.on('timeposition', function(time) {
        
            if (config.multimedia.debug) {
                console.log(glb.Time() + ' [MULTIMEDIA]\t temps ecoule : '+time);
            }
        
            // mise a jour du timing sur le client
            var Duree = {
                total: parseInt(options.tempsMorceau),
                prog: parseInt(time)
            }
            socket.emit('DUREE', Duree);
        });
    }
    startmpv();

	// ----------------------------------------------------- */
	//           premier lancement / connexion IHM           */
	// ----------------------------------------------------- */

	// recuperation reglage equalizer
	Media.GetConfEqual(function(equal) {
		
		if (config.multimedia.verbose) {
			console.log(glb.Time() +' [MULTIMEDIA]\t liste equalizer = '+equal['liste']+' defaut = '+equal['def']+' reglage = '+equal['reg']);
		}
		
		socket.emit('EQUALIZER', equal);
		mpvPlayer.setProperty("af", "equalizer="+equal['reg']);
		
		// recuperation nom playlist + lecture en cours + lancement musique
		Media.RecupPLEnCours( function(PLenCours) {

			if (config.multimedia.verbose) {
				console.log(glb.Time() + ' [MULTIMEDIA]\t playlist en cours : '+PLenCours['PL']+', titre : '+PLenCours['piste']);
			}
	
			//recuperation du morceau à jouer et ses infos
			Media.RecupInfoTitre(PLenCours['PL'], PLenCours['piste'], function(Titre) {
	
				if (config.multimedia.verbose) {
					console.log(glb.Time() + ' [MULTIMEDIA]\t titre à jouer : '+Titre['id']+', '+Titre['nomartist']+', '+Titre['nomalbum']+', '+Titre['date']+', '+Titre['nomtitre']+', '+Titre['duree']+', '+Titre['path']+', '+Titre['coverpath']);
				}

				options.tempsMorceau = Titre['duree'];
				
				// envoi des infos tire au client
				socket.emit('TITRE', Titre);

				// lancement du morceau
				if (config.multimedia.verbose) {
					console.log(glb.Time() + ' [MULTIMEDIA]\t chargement de '+Titre['path']);
				}
				mpvPlayer.load(Titre['path']);
                options.titreencours = Titre['path'];
			
			});
		});
	});

	// ----------------------------------------------------- */
	//    CMDPLAYER    commande MPV from client              */
	// ----------------------------------------------------- */	
	// CMDPLAYER
	socket.on('CMDPLAYER', function(cmd) {
	
		if (config.multimedia.verbose) {
			console.log(glb.Time() + ' [MULTIMEDIA]\t CMDPLAYER reception : '+cmd['cmd']+' - '+cmd);
		}
		
		if (cmd['cmd'] == 'pause') {
		
			if (config.multimedia.verbose) {
				console.log(glb.Time() + ' [MULTIMEDIA]\t CMDPLAYER pause');
			}
			mpvPlayer.pause();	
		}
		
		if (cmd['cmd'] == 'play') {
		
			if (config.multimedia.verbose) {
				console.log(glb.Time() + ' [MULTIMEDIA]\t CMDPLAYER play');
			}
			mpvPlayer.resume();	
		}
	
		if (cmd['cmd'] == 'next' || cmd['cmd'] == 'previous' || cmd['cmd'] == 'PlayThis') {
			
			if (config.multimedia.verbose) {
				console.log(glb.Time() + ' [MULTIMEDIA]\t CMDPLAYER passage au titre suivant '+cmd['cmd']);
			}
			
			// on recupere le titre suivant
			Media.GetNextTitre(cmd, function(NextTitre) {
	
				if (config.multimedia.verbose) {
					console.log(glb.Time() +' [MULTIMEDIA]\t CMDPLAYER titre suivant : '+NextTitre['PLEnCours']+', '+NextTitre['Titre']);
				}

				// comme on change du titre sur l'event 'stop', et que ce dernier refait la mise à jour de PLEnCours
				// --> il faut adapter le NextTitre : NextTitre['Titre'] - 1
				NextTitre['Titre'] = parseInt(NextTitre['Titre']) - parseInt(1);

				// on met à jour la table EnCours
				Media.SetPLEnCours(NextTitre, function() {

					if (config.multimedia.verbose) {
						console.log(glb.Time() +' [MULTIMEDIA]\t CMDPLAYER titre suivant arret du player');
					}

					nextTitle()
				
				});
			});
		};
		
		if (cmd['cmd'] == 'equal') {

			if (config.multimedia.verbose) {
				console.log(glb.Time()+' [MULTIMEDIA]\t CMDPLAYER equalizer '+cmd['param']);
			}

			// changement de l'equalizer par defaut
			Media.SetConfEqual(cmd['param'], function() {
			
				// rechargement nouvelle equalizer
				Media.GetConfEqual(function(equal) {
		
					if (config.multimedia.verbose) {
						console.log(glb.Time() +' [MULTIMEDIA]\t liste equalizer = '+equal['liste']+' defaut = '+equal['def']+' reglage = '+equal['reg']);
					}
					mpvPlayer.setProperty("af", "equalizer="+equal['reg']);
					socket.emit('EQUALIZER', equal);
				});
            
			});
		}
  
        // RAZ temps reprise pour video
        if (cmd['cmd'] == 'razRepriseVDO') {
        
            Media.setTimeRestant(cmd['param'], '0:0:0', function(){
                    
                Media.GetMediaVideo( function(MediaVideo) {
                    if (config.multimedia.debug) {
                        console.log(glb.Time() + ' [MULTIMEDIA]\t RecupMediaVideo : '+MediaVideo);
                    } 
                    socket.emit('LSTVIDEO', MediaVideo);
                });
            });
        }
        
	});


	// ----------------------------------------------------- */
	//           socket demande client CMDCLIENT             */
	// ----------------------------------------------------- */
	// CMDCLIENT
	socket.on('CMDCLIENT', function(cmd) {
	
		if (config.multimedia.verbose) {
			console.log(glb.Time() + ' [MULTIMEDIA]\t CMDCLIENT reception commande : ' + cmd);
		}

		// chargement de la liste des media audio et envoi au client
		if ( cmd == 'RecupMediaAudio' ) {
		
			Media.RecupMedia( function(ResMedia) {
			
				if (config.multimedia.debug) {
					console.log(glb.Time() + ' [MULTIMEDIA]\t RecupMediaAudio : '+ResMedia);
				} 
				socket.emit('LSTAUDIO', ResMedia);
			});
		}
		
		// chargement de la liste des media video et envoi au client
		if ( cmd == 'RecupMediaVideo' ) {
		
			Media.GetMediaVideo( function(MediaVideo) {
			
				if (config.multimedia.debug) {
					console.log(glb.Time() + ' [MULTIMEDIA]\t RecupMediaVideo : '+MediaVideo);
				} 
				socket.emit('LSTVIDEO', MediaVideo);
			});
		}
	
        // recup de la liste des dev bluettoth et envoi au client
        if ( cmd == 'RecupDevBluetooth' ) {
        
            Media.getDevBluetooth( function(device) {
            
                if (config.multimedia.debug) {
                    console.log(glb.Time() + ' [MULTIMEDIA]\t RecupDevBluetooth : '+device);
                } 
                socket.emit('LSTDEVBLUE', device);
            });
        }
    
		// recuperation de la PL en cours
		if ( cmd == 'RecupPL' ) {

			Media.RecupPL( function(ResPL) {
				socket.emit('PLAYLIST', ResPL);
				
				if (config.multimedia.debug) {
					console.log(glb.Time() + " [MULTIMEDIA]\t PLAYLIST mise a jour "+ResPL);
				}
			});
		}
		
		// recuperation de la PL en cours
		if ( cmd == 'RecupJeux' ) {

			Media.GetLstJeux( function(ResJeux) {
				socket.emit('LSTJEUX', ResJeux);
				
				if (config.multimedia.debug) {
					console.log(glb.Time() + " [MULTIMEDIA]\t JEUX mise a jour "+ResJeux);
				}
			});
		}
		
		// RAZMEDIA - raz de la bibliotheque media
		if ( cmd == 'RAZMEDIA' ) {		

			console.log(glb.Time() + " [MULTIMEDIA]\t CMD - activation MajMedia.py");
			var Playlist = child_process.exec('multimedia/MajMedia.py',function (error, stdout, stderr) {
				if (config.multimedia.verbose) {
					console.log(glb.Time() + " PLAYLIST error : " + error);
					console.log(glb.Time() + " PLAYLIST stdout : " + stdout);
					console.log(glb.Time() + " PLAYLIST stderr : " + stderr);				
				}
				
				Media.RecupMedia( function(ResMedia) {
					if (config.multimedia.debug) {
						console.log(glb.Time() + ' [MULTIMEDIA]\t ' + ResMedia);
					}
					socket.emit('LSTAUDIO', ResMedia);
				});
			});		
		} // fin de RAZMEDIA

		// RAZCOVER - raz de la bibliotheque media
		if ( cmd == 'RAZCOVER' ) {		

			console.log(glb.Time() + " [MULTIMEDIA]\t CMD - activation CheckCover.py");
			var Playlist = child_process.exec('multimedia/CheckCover.py',function (error, stdout, stderr) {
				if (config.multimedia.verbose) {
					console.log(glb.Time() + " [MULTIMEDIA]\t RAZCOVER error : " + error);
					console.log(glb.Time() + " [MULTIMEDIA]\t RAZCOVER stdout : " + stdout);
					console.log(glb.Time() + " [MULTIMEDIA]\t RAZCOVER stderr : " + stderr);				
				}
				
				Media.RecupMedia( function(ResMedia) {
					if (config.multimedia.debug) {
						console.log(glb.Time() + ' [MULTIMEDIA]\t ' + ResMedia);
					}
					socket.emit('LSTAUDIO', ResMedia);
				});
			});		
		} // fin de RAZVCOVER
		
		// RAZPLAYALL - re random de la playlist ALL
		if ( cmd == 'RAZPLAYALL' ) {
		
			Media.RazPlayALL( function() {
			
				// relance de la lecture
				Media.RecupPLEnCours( function(PLenCours) {

					if (config.multimedia.verbose) {
						console.log(glb.Time() + ' [MULTIMEDIA]\t RazPlayALL en cours : '+PLenCours['PL']+', titre : '+PLenCours['piste']);
					}
					nextTitle()
				});
			});
		}
		
	});

	// PLAYSELECTED - jouer albums selectionnés
	socket.on('PLAYSELECTED', function (param) {
		
		if (options.verbose) {
			console.log(glb.Time() +' [MULTIMEDIA]\t PLAYSELECTED ' + param);
		}
		
		// creation de la playlist selected
		Media.CreateSelected (param, function() {			
			nextTitle()
		});
	});

	// ----------------------------------------------------- */
	//           activation video                            */
	// ----------------------------------------------------- */
	// PLAYVIDEO
	socket.on('PLAYVIDEO', function(video) {
	
		if (config.multimedia.verbose) {
			console.log(glb.Time() +' [MULTIMEDIA]\t PLAYVIDEO '+video);
		}

        // arret du MPV
        mpvPlayer.quit();

        // recupere heure de depart 
        var t = new Date();
        var startTimeVDO = t.getTime();

        // on recupere le temps de reprise
        Media.getTimeRestant(video, function(time){
            
            //var tmp = string(data);
            var optionReprise = ' --pos '+time;
            
            if (config.multimedia.verbose) {
                console.log(glb.Time() +' [MULTIMEDIA]\t PLAYVIDEO reprise '+optionReprise);
            }
            
            var timeInSecond = time.split(':');
            var remainingSecond = parseInt(timeInSecond[0])*3600 + parseInt(timeInSecond[1])*60 + parseInt(timeInSecond[2]);
            
            if (config.multimedia.verbose) {
                console.log(glb.Time() +' [MULTIMEDIA]\t PLAYVIDEO reprise '+optionReprise+', '+remainingSecond);
            }
            
            var omxplayer = child_process.exec('/usr/bin/'+config.multimedia.playerVDO+optionReprise+' "'+video+'"');
            omxplayer.stdout.on('data', function (data) {
                console.log(glb.Time() +' OMXPLAYER stdout: ' + data);
            });
            omxplayer.stderr.on('data', function (data) {
                console.log(glb.Time() +' OMXPLAYER stderr: ' + data);
            });
            omxplayer.on('exit', function(close) {
            
                console.log(glb.Time() +' OMXPLAYER exit '+options.titreencours);
            
                socket.emit('STOPVDO');
                startmpv();
                mpvPlayer.load(options.titreencours);
            
                // recupere temps ecoule et on le stocke
                var tend = new Date();
                var endTimeVDO = tend.getTime();
                var remainingTime = parseInt(((parseInt(endTimeVDO) - parseInt(startTimeVDO))/1000)+parseInt(remainingSecond));

                var reste = remainingTime;
                var nbJours=Math.floor(reste/(3600*24));
                reste -= nbJours*24*3600;
 
                var nbHours=Math.floor(reste/3600);
                reste -= nbHours*3600;
 
                var nbMinutes=Math.floor(reste/60);
                reste -= nbMinutes*60;
 
                var nbSeconds=reste;
            
                Media.setTimeRestant(video, nbHours+':'+nbMinutes+':'+nbSeconds, function(){
                    
                    Media.GetMediaVideo( function(MediaVideo) {
                        if (config.multimedia.debug) {
                            console.log(glb.Time() + ' [MULTIMEDIA]\t RecupMediaVideo : '+MediaVideo);
                        } 
                        socket.emit('LSTVIDEO', MediaVideo);
                    });
                });
            
                //fs.writeFile('/home/pi/'+video+'_REMAINING', nbHours+':'+nbMinutes+':'+nbSeconds, 'UTF8', function(err) {
                //    if (err) {
                //        console.log(glb.Time() + ' [MULTIMEDIA]\t ERR ecriture fichier startTime '+err);
                //    }
                //});
            });
        });
	});

	// ----------------------------------------------------- */
	//           activation jeux vidéo                       */
	// ----------------------------------------------------- */
	// PLAYJEUX
	socket.on('PLAYJEUX', function (jeux) {
	
		if (config.multimedia.verbose) {
			console.log(glb.Time() +' [MULTIMEDIA]\t PLAYJEUX : activation jeux : '+jeux['ID']+', son : '+jeux['son']);
		}
		
		// recup des infos du jeux
		Media.GetInfoJeux(jeux['ID'], function(InfoJeux) {
		
			if (config.multimedia.verbose) {
				console.log(glb.Time() +' [MULTIMEDIA]\t PLAYJEUX : activation jeux : '+InfoJeux[0]['id']+', '+InfoJeux[0]['nomJeux']+', '+InfoJeux[0]['path']+', '+InfoJeux[0]['coverPath']+', '+InfoJeux[0]['emulator']);
			}
		
			var cmd = InfoJeux[0]['emulator']+' "'+InfoJeux[0]['path']+'"'
			var emul = child_process.exec(cmd);
			emul.stdout.on('data', function (data) {
				console.log(glb.Time() +' EMUL stdout: ' + data);
			});
			emul.stderr.on('data', function (data) {
				console.log(glb.Time() +' EMUL stderr: ' + data);
			});
			emul.on('close', function(close) {
				console.log(glb.Time() +' EMUL close');
				socket.emit('STOPJEUX');
			})
			emul.on('exit', function(close) {
				console.log(glb.Time() +' EMUL exit');
				socket.emit('STOPJEUX');
			})
		});
	
	});
	
    // ----------------------------------------------------- */
    //           activation BLUETOOTH                        */
    // ----------------------------------------------------- */
    // PLAYBLUETOOTH
    socket.on('PLAYBLUETOOTH', function(macid) {
    
        if (config.multimedia.verbose) {
            console.log(glb.Time() +' [MULTIMEDIA]\t PLAYBLUETOOTH '+macid);
        }

        var cmd = macid.split('_');
        
        if ( cmd[0] == 'start' ) {
            
            // arret du MPV
            mpvPlayer.quit();
       
            // activation et connection du device
            var startbluetooth = child_process.exec("sh ./system/ConnectAudioBluetooth.sh "+cmd[0]+" "+cmd[1]);
            startbluetooth.stdout.on('data', function (data) {
                console.log(glb.Time() +' startbluetooth stdout: ' + data);
            });
            startbluetooth.stderr.on('data', function (data) {
                console.log(glb.Time() +' startbluetooth stderr: ' + data);
            });
            startbluetooth.on('close', function(close) {
                console.log(glb.Time() +' startbluetooth close');
            })
            startbluetooth.on('exit', function(close) {
                console.log(glb.Time() +' startbluetooth exit');
            })
        }
       
        if ( cmd[0] == 'stop' ) {
            
            // arrêt tcpdump et bluealsa
            var stopbluetooth = child_process.exec("sh ./system/ConnectAudioBluetooth.sh "+cmd[0]+" "+cmd[1]);
            stopbluetooth.stdout.on('data', function (data) {
                console.log(glb.Time() +' stopbluetooth stdout: ' + data);
            });
            stopbluetooth.stderr.on('data', function (data) {
                console.log(glb.Time() +' stopbluetooth stderr: ' + data);
            });
            stopbluetooth.on('close', function(close) {
                console.log(glb.Time() +' stopbluetooth close');
                // relance du MPV
                startmpv();
                mpvPlayer.load(options.titreencours);
            })
            stopbluetooth.on('exit', function(close) {
                console.log(glb.Time() +' stopbluetooth exit');
            })
            }
        
            
            
    });

    
	/* ----------------------------------------------------- */
	/*            les fonctions                              */
	/* ----------------------------------------------------- */
	function nextTitle() {
		
		// on recupere le titre suivant
		Media.GetNextTitre('next', function(NextTitre) {
	
			if (config.multimedia.debug) {
				console.log(glb.Time() +' [MULTIMEDIA]\t titreSuivant, suivant : '+NextTitre['PLEnCours']+', '+NextTitre['Titre']);
			}

			// on met à jour la table EnCours
			Media.SetPLEnCours(NextTitre, function(){});
		
			// On recupere les infos du titre à jouer
			Media.RecupInfoTitre(NextTitre['PLEnCours'], NextTitre['Titre'], function(Titre) {
	
				if (config.multimedia.verbose) {
					console.log(glb.Time() + ' [MULTIMEDIA]\t titreSuivant, titre à jouer : '+Titre['id']+', '+Titre['nomArtist']+', '+Titre['nomAlbum']+', '+Titre['date']+', '+Titre['nomTitre']+', '+Titre['duree']+', '+Titre['path']+', '+Titre['coverPath']);
				}
			
				options.tempsMorceau = Titre['duree'];
			
				// on lance la lecture sur le player
				mpvPlayer.loadFile(Titre['path']);
			
				// on met à jour le client
				socket.emit('DUREE', {total:options.tempsMorceau, prog:0})
				socket.emit('TITRE', Titre);
				Media.RecupPL( function(ResPL) {
					socket.emit('PLAYLIST', ResPL);
				});
		
			});
		});
	}
	
});
