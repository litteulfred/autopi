// insertion des librairies
var child_process = require('child_process'),
	_ = require('lodash'),
	fs = require('fs'),
	glb = require('globalAutoradio'),
	ini = require('ini');

console.log(glb.Time() + ' [MASTER]\t start');


var defaults = {
    time: '',
};
options = _.defaults(defaults);

/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8');
 
//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);

var gpsON = false;
var sysON = false;

/* ----------------------------------------------------- */
/* activation HTTP SERVER, puis IHM                      */
/* ----------------------------------------------------- */
if (config.master.http) {

	console.log(glb.Time() + ' [MASTER]\t activation HTTP');

	var http = child_process.exec('nodejs ./common/http.js');
	http.stdout.on('data', function (data) {
		
		//console.log('INFO '+data);
		
		if (config.master.verbose) {
			fs.appendFile('log/http.log', 'INFO '+data, 'UTF8', function(err) {
				if (err) {
					console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
				}
			});
		}
		
		if ( data.indexOf("STARTINGHTTP") != -1 ) {
			
			if (config.master.verbose) {
				console.log(glb.Time() + ' [MASTER]\t HTTP started --> start IHM ');
			}
			
            if ( fs.existsSync('./init') ) {
                   
                   startIhmInit();
                   
            } else {
                   
                   if (config.master.ihmMedia) {
                    startIhmMedia();
                   }
            
                   if (config.master.ihmSystem) {
                    startIhmSystem ()
                   }
            }
		}
	});
	http.stderr.on('data', function (data) {
		if (config.master.verbose) {
			fs.appendFile('log/http.log', 'ERROR '+data, 'UTF8', function(err) {
				if (err) {
					console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
				}
			});
		}
	});
}

/* ----------------------------------------------------- */
/* activation base de donnee et multimedia               */
/* ----------------------------------------------------- */
if (config.master.database) {

    console.log(glb.Time() + ' [MASTER]\t activation POSTGRES');
    
    var database = child_process.exec('sh ./sql/postgresql.sh start');
    database.stdout.on('data', function (data) {
                                      
        if (config.master.verbose) {
            fs.appendFile('log/postgresql.log', 'INFO '+data, 'UTF8', function(err) {
                if (err) {
                    console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                }
            });
        }
                   
        if ( data.indexOf("server started") != -1 ) {
            
            if (config.master.verbose) {
                      console.log(glb.Time() + ' [MASTER]\t server POSTGRES started');  
            }
                       
            if ( fs.existsSync('./init') ) {
                   
                   console.log(glb.Time() + ' [MASTER]\t initialisation autoradio');
                   
                   var initMulti = child_process.exec('nodejs ./multimedia/initMultimedia.js');
                   initMulti.stdout.on('data', function (data) {
                                       
                        console.log('INFO '+data);
                        
                        if (config.master.verbose) {
                            fs.appendFile('log/initMulti.log', 'INFO '+data, 'UTF8', function(err) {
                                if (err) {
                                    console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                                }
                            });
                        }
                    });
                    initMulti.stderr.on('data', function (data) {
                        if (config.master.verbose) {
                            fs.appendFile('log/initMulti.log', 'ERROR '+data, 'UTF8', function(err) {
                                if (err) {
                                    console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                                }
                            });
                        }
                    });
                   
            } else {
                   
                   startMultimedia();
            }
        }
    })
    database.stderr.on('data', function (data) {
        if (config.master.verbose) {
            fs.appendFile('log/postgresql.log', 'ERROR '+data, 'UTF8', function(err) {
                if (err) {
                    console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                }
            });
        }
    });
}


/* ----------------------------------------------------- */
/*       les fonction                                    */
/* ----------------------------------------------------- */
function startIhmInit() {

    var IhmInit = child_process.exec('python ./multimedia/ihmInit.py');
    IhmInit.stdout.on('data', function (data) {
        if (config.master.verbose) {
            fs.appendFile('log/ihmInit.log', 'INFO '+data, 'UTF8', function(err) {
                if (err) {
                    console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                }
            });
        }
    });
    IhmInit.stderr.on('data', function (data) {
        if (config.master.verbose) {
            fs.appendFile('log/ihmInit.log', 'ERROR '+data, 'UTF8', function(err) {
                if (err) {
                    console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                }
            });
        }
    });
}
function startMultimedia() {

	if (config.master.multimedia) {

		console.log(glb.Time() + ' [MASTER]\t activation MULTIMEDIA');

		var multi = child_process.exec('nodejs ./multimedia/multimedia.js');
		multi.stdout.on('data', function (data) {
			if (config.master.verbose) {
				fs.appendFile('log/multimedia.log', 'INFO '+data, 'UTF8', function(err) {
					if (err) {
						console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
					}
				});
			}
                        
            if ( data.indexOf("chargement de media") != -1 ) {
                if (config.master.verbose) {
                    console.log(glb.Time() + ' [MASTER]\t multimedia started');  
                }
            }
		});
		multi.stderr.on('data', function (data) {
			if (config.master.verbose) {
				fs.appendFile('log/multimedia.log', 'ERROR '+data, 'UTF8', function(err) {
					if (err) {
						console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
					}
				});
			}
		});
	}
}
function startIhmMedia() {
	/* ----------------------------------------------------- */
	/* activation ihmMedia                                   */
	/* ----------------------------------------------------- */
	
    console.log(glb.Time() + ' [MASTER]\t activation IHMMEDIA');
	
    var Ihm = child_process.exec('python ./multimedia/ihmMedia.py');
    Ihm.stdout.on('data', function (data) {
        if (config.master.verbose) {
            fs.appendFile('log/ihmMedia.log', 'INFO '+data, 'UTF8', function(err) {
                if (err) {
                    console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                }
            });
        }
    });
    Ihm.stderr.on('data', function (data) {
        if (config.master.verbose) {
            fs.appendFile('log/ihmMedia.log', 'ERROR '+data, 'UTF8', function(err) {
                if (err) {
                    console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                }
            });
        }
    });
}
function startIhmSystem () {
    
    var fenSys = child_process.exec('python ./system/ihmSystem.py');
    
    fenSys.stdout.on('data', function (data) {
                     fs.appendFile('log/ihmSystem.log', 'INFO '+data, 'UTF8', function(err) {
                                   if (err) {
                                   console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                                   }
                                   });
                     });
    fenSys.stderr.on('data', function (data) {
                     fs.appendFile('log/ihmSystem.log', 'ERROR '+data, 'UTF8', function(err) {
                                   if (err) {
                                   console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                                   }
                                   });
                     });
    fenSys.on('close', function (code) {
              fs.appendFile('log/ihmSystem.log', ' ihmSystem END : ' + code, 'UTF8', function(err) {
                            if (err) {
                            console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                            }
                            });
              sysON = false;
              });
    sysON = true;
}


/* ----------------------------------------------------- */
/* activation USB                                        */
/* ----------------------------------------------------- */
if (config.master.usb) {

	console.log(glb.Time() + ' [MASTER]\t activation USB');


	var usb = child_process.exec('nodejs ./common/usb.js');
	usb.stdout.on('data', function (data) {
		if (config.master.verbose) {
			fs.appendFile('log/usb.log', 'INFO '+data, 'UTF8', function(err) {
				if (err) {
					console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
				}
			});
		}
	});
	usb.stderr.on('data', function (data) {
		if (config.master.verbose) {
			fs.appendFile('log/usb.log', 'ERROR '+data, 'UTF8', function(err) {
				if (err) {
					console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
				}
			});
		}
	});
}


/* ----------------------------------------------------- */
/* activation check system                               */
/* ----------------------------------------------------- */
if (config.master.system) {

	console.log(glb.Time() + ' [MASTER]\t activation SYSTEM');

	var System = child_process.exec('nodejs ./system/system.js');
	System.stdout.on('data', function (data) {
		if (config.master.verbose) {
			fs.appendFile('log/system.log', 'INFO '+data, 'UTF8', function(err) {
				if (err) {
					console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
				}
			});
		}
	});
	System.stderr.on('data', function (data) {
		fs.appendFile('log/system.log', 'ERROR '+data, 'UTF8', function(err) {
			if (err) {
				console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
			}
		});
	});
}

/* ----------------------------------------------------- */
/* activation gps radar / POI                            */
/* ----------------------------------------------------- */
if (config.master.gpsRadar) {

	console.log(glb.Time() + ' [MASTER]\t activation GPSRADAR');

	var gpsRadar = child_process.exec('nodejs ./gps/gpsRadar.js');
	gpsRadar.stdout.on('data', function (data) {
		if (config.master.verbose) {
			fs.appendFile('log/gpsRadar.log', 'INFO '+data, 'UTF8', function(err) {
				if (err) {
					console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
				}
			});
		}
	});
	gpsRadar.stderr.on('data', function (data) {
		if (config.master.verbose) {
			fs.appendFile('log/gpsRadar.log', 'ERROR '+data, 'UTF8', function(err) {
				if (err) {
					console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
				}
			});
		}
	});
}

/* ----------------------------------------------------- */
/* activation serveur socket                             */
/* ----------------------------------------------------- */
var io = require('socket.io').listen('8121');
io.sockets.on('connection', function (socket) {
	
	console.log('INFO '+glb.Time() +' [MASTER]\t Un client est connecté !');
   
	socket.on('MSG', function(data) {
		console.log('INFO '+glb.Time() +' [MASTER]\t MSG = '+data);
	});   
   
   	// arret des applis
	socket.on('END', function(param) {
	
		console.log('INFO '+glb.Time() +' [MASTER]\t arret des applications '+param);
		
        var Ps = '';
		if ( param ) {
		
			// Ps = child_process.exec('sh ./system/kill.sh none '+param);
			Ps = child_process.exec('sh ./system/kill.sh halt ALL');
			
			if ( param.indexOf("navigo.js") != -1 )
				gpsON = false;
		
		} else {
		
			Ps = child_process.exec('sh ./system/kill.sh halt ALL');
			
		}
		Ps.stdout.on('data', function (data) {
			console.log('INFO '+glb.Time()+' KILL '+data);
		});
		Ps.stderr.on('data', function (data) {
			console.log('ERROR '+glb.Time()+' KILL '+data);
		});	
	});
	
	// PAUSE - mise en pause du lecteur (reception usb.js, envoi IHMMEDIA)
	var d = new Date();
	var tempo = d.getTime(); 
	socket.on('BUTTVOL', function() {
		
		console.log(glb.Time() + " [MASTER]\t reception bouton PAUSE");

		socket.broadcast.emit('PAUSE', 'rien');
	
	})

	// RAZMEDIA - raz de la bibliotheque media
	socket.on('RAZMEDIA', function() {		

			console.log(glb.Time() + " [MULTIMEDIA]\t CMD - activation MajMedia.py");
			var Playlist = child_process.exec('multimedia/MajMedia.py',function (error, stdout, stderr) {
				if (options.verbose) {
					console.log(glb.Time() + " PLAYLIST error : " + error);
					console.log(glb.Time() + " PLAYLIST stdout : " + stdout);
					console.log(glb.Time() + " PLAYLIST stderr : " + stderr);				
				}
				
				Media.RecupMedia( function(ResMedia) {
					if (options.debug) {
						console.log(glb.Time() + ' [MULTIMEDIA]\t ' + ResMedia);
					}
					socket.emit('LSTAUDIO', ResMedia);
				});
			});		
		}); 
	
	// restart des applis
	socket.on('RESTART', function() {
	
		console.log('INFO '+glb.Time() +' [MASTER]\t restart des applications');
		
		var restart = child_process.exec('sh ./system/restart.sh');
		restart.stdout.on('data', function (data) {
			console.log('INFO '+glb.Time()+' RESTART '+data);
		});
		restart.stderr.on('data', function (data) {
			console.log('ERROR '+glb.Time()+' RESTART '+data);
		});	
	});
	
	socket.on('RESET', function() {
	
		console.log('INFO '+glb.Time() +' [MASTER]\t reset multimedia');
		
		var initFile = child_process.exec('touch init');
		var restart = child_process.exec('sh ./system/restart.sh');
		restart.stdout.on('data', function (data) {
			console.log('INFO '+glb.Time()+' RESTART '+data);
		});
		restart.stderr.on('data', function (data) {
			console.log('ERROR '+glb.Time()+' RESTART '+data);
		});	
	});
    
    // bascule de fenêtre ou activation appli
    socket.on('SWITCH', function(fenetre, param) {
    			
    	console.log('INFO '+glb.Time()+' fenetre '+fenetre);
    	
		if (fenetre == 'NAVIT' ) {
		
			// verification si itineraire present
			if (param) {
			
				// arret de Navit
				var Ps = child_process.exec('sh ./system/kill.sh none navit');
				Ps.stdout.on('data', function (data) {
					console.log('INFO '+glb.Time()+' KILL '+data);
				});
				Ps.stderr.on('data', function (data) {
					console.log('ERROR '+glb.Time()+' KILL '+data);
				});
				
				// positionnement iti
				child_process.exec('cp -p data/navit/conf/'+param+' data/navit/conf/destination.txt');
				
				gpsON = false;
			}
		
    		if (! gpsON) {
				var Navit = child_process.exec('cd navit; ./navit -c config/navit.xml');
				Navit.stdout.on('data', function (data) {
					fs.appendFile('log/navit.log', 'INFO '+data, 'UTF8', function(err) {
						if (err) {
							console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
						}
					});
				});
				Navit.stderr.on('data', function (data) {
					fs.appendFile('log/navit.log', 'ERROR '+data, 'UTF8', function(err) {
						if (err) {
							console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
						}
					});
				});
				Navit.on('close', function (code) {
					fs.appendFile('log/navit.log', ' NAVIT END : ' + code, 'UTF8', function(err) {
						if (err) {
							console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
						}
					});
					gpsON = false;
				});
				gpsON = true;
			} else {
				var Switch = child_process.exec('system/ChgtWindows.sh NAVIT');
                Switch.stdout.on('data', function (data) {
                    fs.appendFile('log/system.log', 'INFO '+data, 'UTF8', function(err) {
                        if (err) {
                            console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                        }
                    });
                });
                Switch.stderr.on('data', function (data) {
                    fs.appendFile('log/system.log', 'ERROR '+data, 'UTF8', function(err) {
                        if (err) {
                            console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
                        }
                    });
                });            
			}	
		}
		
		if (fenetre == 'AUTORADIO' ) {    			
			var Switch = child_process.exec('system/ChgtWindows.sh AUTORADIO');
		}
		
		if (fenetre == 'SYSTEM' ) {
		
			if (! sysON) {
				startIhmSystem ();
			} else {
				var Switch = child_process.exec('system/ChgtWindows.sh SYSTEM');
			}  			
		}
		
		if (fenetre == 'GPS' ) {
		
			var fenGps = child_process.exec('python ./gps/ihmGps.py');
			fenGps.stdout.on('data', function (data) {
				fs.appendFile('log/ihmGps.log', 'INFO '+data, 'UTF8', function(err) {
					if (err) {
						console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
					}
				});
			});
			fenGps.stderr.on('data', function (data) {
				fs.appendFile('log/ihmGps.log', 'ERROR '+data, 'UTF8', function(err) {
					if (err) {
						console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
					}
				});
			});
			fenGps.on('close', function (code) {
				fs.appendFile('log/ihmGps.log', ' ihmSystem END : ' + code, 'UTF8', function(err) {
					if (err) {
						console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
					}
				});
			});
		}
		
		if ( fenetre == 'NAVIGO' ) {
		
			if (! gpsON) {
	
    	        console.log(glb.Time() + ' [MASTER]\t gpsON='+gpsON+' activation NAVIGO');
        
				var navigo = child_process.exec('node ./gps/navigo.js');
				navigo.stdout.on('data', function (data) {
					fs.appendFile('log/navigo.log', 'INFO '+data, 'UTF8', function(err) {
						if (err) {
							console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
						}
					});
				});
				navigo.stderr.on('data', function (data) {
					fs.appendFile('log/navigo.log', 'ERROR '+data, 'UTF8', function(err) {
						if (err) {
							console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
						}
					});
				});
				navigo.on('close', function (code) {
					fs.appendFile('log/navigo.log', ' navigo END : ' + code, 'UTF8', function(err) {
						if (err) {
							console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
						}
					});
				});
		
				var ihmNavigo = child_process.exec('python ./gps/ihmNavigo.py');
				ihmNavigo.stdout.on('data', function (data) {
					fs.appendFile('log/ihmNavigo.log', 'INFO '+data, 'UTF8', function(err) {
						if (err) {
							console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
						}
					});
				});
				ihmNavigo.stderr.on('data', function (data) {
					fs.appendFile('log/ihmNavigo.log', 'ERROR '+data, 'UTF8', function(err) {
						if (err) {
							console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
						}
					});
				});
				ihmNavigo.on('close', function (code) {
					fs.appendFile('log/ihmNavigo.log', ' navigo END : ' + code, 'UTF8', function(err) {
						if (err) {
							console.log(glb.Time() + ' [MASTER]\t ERR ecriture log '+err);
						}
					});
				});
				gpsON = true;
				
			} else {
                console.log(glb.Time() + ' [MASTER]\t gpsON='+gpsON+' switch NAVIGO');
				var Switch = child_process.exec('system/ChgtWindows.sh NAVIGO');
			}
		}
	});
    
});
