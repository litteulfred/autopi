var DBWrapper = require('node-dbi').DBWrapper,
	_ = require('lodash'),
	fs = require('fs'),
	glb = require('globalAutoradio');

// mis en place des modes options globales
var defaults = {
    verbose: true,
    debug: false
};
options = _.defaults(defaults);

// connection à la base de donnée MySQL
if (options.verbose) {
	console.log(glb.Time() + ' connexion a la base de donnée ...');
}
db = new DBWrapper( 'pg', {
	host     : '127.0.0.1',
 	user     : 'pi',
  	password : 'muscadet',
  	database : 'db_media',
});
db.connect( function(err) {

	if (err) {
		console.log(glb.Time() + ' [LIBMEDIA]\t Error connecting database ...'+err);
		process.exit(1);
	} else {
		console.log(glb.Time() + ' [LIBMEDIA]\t Database is connected ...');
	}
});

// recuperation des media
function RecupMedia (callback) {
	
	if (options.verbose) {
		console.log(glb.Time() + ' [LIBMEDIA]\t RecupMedia : extraction de la liste des Media');
	}
	
	// recuperation des MEDIA
	db.fetchAll('SELECT albums.id, artists.nomartist, albums.nomalbum, albums.date, albums.coverpath FROM albums '+
							'INNER JOIN artists on artists.id = albums.artistsid '+
							'ORDER BY artists.nomartist, albums.date', function(err, result, fields) {
		if(err) {
			console.log(glb.Time() + ' [LIBMEDIA]\t RecupMedia '+err);    
		} else {
		
			if (options.debug) {
				console.log(glb.Time() + ' [LIBMEDIA]\t RecupMedia '+result);
			}
			callback(result);
		}
	});
};

// recupation Playlist complete en cours
function RecupPL (callback) {
	
	// recuperation nom playlist + lecture en cours
	db.fetchAll("SELECT playlist, numpiste FROM encours WHERE id = 1", function(err, result) {
		if(err) {
			console.log(glb.Time() + ' [LIBMEDIA]\t RecupPL - SELECT PL ' + err);    
		} else {
			var PlayEnCours = result[0]['playlist'];
			var TitreEnCours = result[0]['numpiste'];
			
			if (options.verbose) {
				console.log(glb.Time() + ' [LIBMEDIA]\t RecupPL - playlist en cours : ' + PlayEnCours + ' titre : ' + TitreEnCours);
			}
							
			// recuperation du nombre de titre de la PL
			db.fetchAll("SELECT id FROM "+PlayEnCours+" ORDER BY id DESC LIMIT 1", function(err, result) {

				if(err) {

					console.log(glb.Time() + ' [LIBMEDIA]\t RecupPL - COUNT ' + err);    

				} else {
			
					var NbrTitre = result[0]['id'];
					
					if (options.verbose) {
						console.log(glb.Time() + ' [LIBMEDIA]\t RecupPL - nombre de titre composant la PL : '+NbrTitre);
					}

					// positionnement du titre suivant
					var TitreSuivant = parseInt(TitreEnCours) + parseInt(1);
					if ( TitreEnCours == NbrTitre ) {
					
						// on retourne au début de la liste
						TitreSuivant = "1";
					}

					// recuperation playlist en cours et affichage sur page web			
					var ReqSql = 'SELECT '+PlayEnCours+'.id, artists.nomartist, titres.nomtitre FROM '+PlayEnCours+' '+
									'INNER JOIN titres ON titres.id = '+PlayEnCours+'.titreid '+
									'INNER JOIN artists ON artists.id = titres.artistsid '+
									'WHERE '+PlayEnCours+'.id BETWEEN '+TitreSuivant+' AND '+NbrTitre+
									' ORDER BY '+PlayEnCours+'.id';
					if (options.verbose) {
						console.log(glb.Time() + " [LIBMEDIA]\t RecupPL - REQSQL "+ReqSql);
					}
					db.fetchAll(ReqSql, function(err, result) {
						if(err) {
							console.log(glb.Time() + ' [LIBMEDIA]\t RecupPL - REQSQL ' + err);    
						} else {
						
							result[0]['count'] = NbrTitre;
							result[0]['encours'] = TitreEnCours;
							result[0]['plencours'] = PlayEnCours;
							
							if (options.verbose) {
								console.log(glb.Time() + ' [LIBMEDIA]\t RecupPL - envoi PL au client '+result[0]['count']+'-'+result[0]['encours']);
							}
							callback(result);
						}
					});
				}
			});
		}
	});
};

// recuperation nom playlist + lecture en cours
function RecupPLEnCours (callback) {

	db.fetchAll("SELECT playlist, numpiste FROM encours WHERE id = 1", function(err, result) {
		if(err) {
			console.log(glb.Time() + ' [RecupPLEnCours]\t' + err);    
		} else {
			
			var PLenCours = { 
				PL: result[0]['playlist'],
				piste: result[0]['numpiste']
			};
			
			if (options.verbose) {	
				console.log(glb.Time() + ' [LIBMEDIA]\t RecupPLEnCours - playlist en cours : '+PLenCours['PL']+', titre : '+PLenCours['piste']);
			}
			
			callback(PLenCours);
		}
	});
}

// recuperation des infos titres
function RecupInfoTitre(PlayEnCours, TitreAjouer, callback) {

	if (options.verbose) {
		console.log(glb.Time() + ' [LIBMEDIA]\t RecupInfoTitre - recuperation des datas du titres '+PlayEnCours+', '+TitreAjouer);
	}
	var ReqSql = 'SELECT '+PlayEnCours+'.id, artists.nomartist, albums.nomalbum, albums.date, titres.nomtitre, titres.piste, titres.duree, titres.path, albums.coverpath, titres.bitrate, titres.bitrate_mode, titres.stereo, titres.versmpeg, titres.encoder, titres.nbrchannel FROM '+PlayEnCours+' '+
					'INNER JOIN titres ON '+PlayEnCours+'.titreid = titres.id '+
					'INNER JOIN artists ON titres.artistsid = artists.id '+
					'INNER JOIN albums ON titres.albumsid = albums.id '+
					'WHERE '+PlayEnCours+'.id = '+TitreAjouer
					
	db.fetchAll(ReqSql, function(err, result) {
		if(err) {
			console.log(glb.Time() + err);    
		} else {
					
			var Titre = result[0];
			
			if (options.verbose) {
				console.log(glb.Time() + ' [LIBMEDIA]\t RecupInfoTitre - titre à jouer : '+Titre['id']+', '+Titre['nomartist']+', '+Titre['nomalbum']+', '+Titre['date']+', '+Titre['nomtitre']+', '+Titre['duree']+', '+Titre['path']+', '+Titre['coverpath']);
			}
					
			// envoi des données au client
			callback(Titre);
		}
	});
}

// Recup du tite suivant
function GetNextTitre (sens, callback) {

	if (options.verbose) {
		console.log(glb.Time()+' [LIBMEDIA]\t GetNextTitre  : sens '+sens['cmd']);
	}

	// recuperation nom playlist + lecture en cours
	db.fetchAll("SELECT playlist, numpiste FROM encours WHERE id = 1", function(err, result) {

		if(err) {
			console.log(glb.Time()+' [LIBMEDIA]\t GetNextTitre ' + err);    
		} else {
	
			var PlayEnCours = result[0]['playlist'];
			var TitreEnCours = result[0]['numpiste'];
			var NextTitre = {
					PLEnCours: PlayEnCours,
					Titre: TitreEnCours
				};
			
			// recuperation du nombre de titre de la PL
			db.fetchAll("SELECT id FROM "+PlayEnCours+" ORDER BY id DESC LIMIT 1", function(err, result) {

				if(err) {
					console.log(glb.Time()+' [LIBMEDIA]\t GetNextTitre ' + err);    
				} else {
			
					// si dernier morceau, retour au morceau 1
					if ( TitreEnCours == result[0]['id']) {
					
						console.log(glb.Time()+' [LIBMEDIA]\t GetNextTitre reprise de la lecture au debut de la PL');
						NextTitre['Titre'] = 1;

					} else if ( sens['cmd'] == 'previous' ) {
						
						// on prevoit le morceau précédent
						NextTitre['Titre'] = parseInt(TitreEnCours) - parseInt(1);
						
					} else if ( sens['cmd'] == 'PlayThis' ) {
					
						NextTitre['Titre'] = sens['param'];
					
					} else {
							
						// sinon, on joue le morceau suivant dans la table playlist
						NextTitre['Titre'] = parseInt(TitreEnCours) + parseInt(1);
					}
						
					console.log(glb.Time()+' [LIBMEDIA]\t GetNextTitre playlist en cours : titre précédent '+TitreEnCours+', futur '+ NextTitre['PLEnCours'] + ' titre suivant : ' + NextTitre['Titre']);
					callback(NextTitre);
				}
			});
		}
	});
						
}

// mise a jour de la table EnCours
function SetPLEnCours (NextTitre, callback) {
	
	// mise a jour de table EnCours
	db.fetchAll("UPDATE encours SET playlist = '"+NextTitre['PLEnCours']+"', numPiste = '"+NextTitre['Titre']+"' WHERE id = 1", function(err, result) {
		if(err) {
			console.log(glb.Time()+' [LIBMEDIA]\t SetPLEnCours '+ err);    
		} else {
		
			if (options.verbose) {
				console.log(glb.Time()+' [LIBMEDIA]\t SetPLEnCours '+NextTitre['PlEnCours']+', '+NextTitre['Titre']);
			}
		}
		callback();
	});
}

// recreation de la table PlayALL
function RazPlayALL (callback) {

	if (options.verbose) {
		console.log(glb.Time()+' [LIBMEDIA]\t RazPlayALL suppression de la table playALL');
	}

	// suppression de la table playALL	
	db.fetchAll("DROP TABLE IF EXISTS playall;", function(err, result) {
		if(err) {
			console.log(glb.Time()+' [LIBMEDIA]\t RazPlayALL '+ err);    
		} else {
					
			// recréation de la table
			console.log(glb.Time()+' [LIBMEDIA]\t RazPlayALL re creation de la table playALL'); 
			db.fetchAll("CREATE TABLE IF NOT EXISTS playALL (id SERIAL, titreid SMALLINT)", function(err, result) {
				if(err) {
					console.log(glb.Time()+' [LIBMEDIA]\t RazPlayALL '+ err);    
				} else {
					
					// insertion en random
					console.log(glb.Time()+' [LIBMEDIA]\t RazPlayALL chargement playALL');
					db.fetchAll("INSERT INTO playall (titreid) SELECT id FROM titres ORDER BY random()", function(err, result) {
						if(err) {
							console.log(glb.Time()+' [LIBMEDIA]\t RazPlayALL '+ err);    
						} else {
								
							// mise à jour PlEnCours et activation du suivant
							db.fetchAll("UPDATE encours SET playlist = 'playall', numPiste = 0 WHERE id = 1", function(err, result) {
								if(err) {
									console.log(glb.Time()+' [LIBMEDIA]\t RazPlayALL '+ err);    
								} else {
										
									callback();
								}
							});
						}
					});
				}
			});
		}
	});
}

// creation playlist selected
function CreateSelected (param, callback) {

	var LstIDAlbum = param.split(":");
	var OrderBy = "albumsid, piste";
		
	// position de mode de tri RANDOM
	if (LstIDAlbum[0] == "RAND" ) {
		OrderBy = "random()";
	}
		
	// creation de la playlist SELECTED
	db.fetchAll("DROP TABLE IF EXISTS playselected;", function(err, result) {
		if(err) {
			console.log(glb.Time() +' [LIBMEDIA]\t CreateSelected '+ err);    
		} else {
			
			// creation de la table playSelected
			db.fetchAll("CREATE TABLE IF NOT EXISTS playselected (id SERIAL,titreid SMALLINT)", function(err, result) {
				if(err) {
					console.log(glb.Time() +' [LIBMEDIA]\t CreateSelected '+ err);    
				} else {
				
					var IDSelect = "";
					for (var i = 1, c = LstIDAlbum.length; i < c; i++) {
							
						if ( IDSelect == "" ) {
							IDSelect = "albumsid = "+LstIDAlbum[i];
						} else {
							IDSelect = IDSelect+" OR albumsid = "+LstIDAlbum[i];
						}
					}
						
					// Requete SQL
					ReqSql = 'INSERT INTO playselected (titreid) '+
								'SELECT id FROM titres WHERE '+IDSelect+
								' ORDER BY '+OrderBy;
					db.fetchAll(ReqSql, function(err, result) {
						if(err) {
							console.log(glb.Time() +' [LIBMEDIA]\t CreateSelected '+ err);    
						} else {

							// mise à jour PlEnCours et activation du suivant
							db.fetchAll("UPDATE encours SET playlist = 'playselected', numPiste = '0' WHERE id = 1", function(err, result) {
								if(err) {
									console.log(glb.Time() +' [LIBMEDIA]\t CreateSelected '+ err);    
								} else {
										
									callback();
								}
							});
						}
					});
				}
			});
		}
	});
}

// liste des fichiers présent dans media/video
function GetMediaVideo(callback) {

	if (options.verbose) {
		console.log(glb.Time() + ' [LIBMEDIA]\t GetLstVideo : extraction de la liste des Media video');
	}
	
	// recuperation des MEDIA
	db.fetchAll('SELECT id, nomtitre, path, duree, reprise, coverpath FROM videos ORDER BY nomtitre', function(err, result) {
	
		if(err) {
			console.log(glb.Time() + ' [LIBMEDIA]\t GetLstVideo '+err);    
		} else {
		
			if (options.debug) {
				console.log(glb.Time() + ' [LIBMEDIA]\t GetLstVideo '+result);
			}
			callback(result);
		}
	});

}

// recupere info de la video
function GetVideoInfo(id, callback) {

	if (options.verbose) {
		console.log(glb.Time() + ' [LIBMEDIA]\t GetVideoInfo : extraction info video '+id);
	}

	db.fetchAll('SELECT path FROM videos WHERE id LIKE "'+id+'"', function(err, result) {
	
		if(err) {
			console.log(glb.Time() + ' [LIBMEDIA]\t GetVideoInfo '+err);    
		} else {
			
			if (options.verbose) {
				console.log(glb.Time() + ' [LIBMEDIA]\t GetVideoInfo : extraction info video '+result[0]['path']);
			}
			callback(result);
		}
	});
}; 

// recuperation liste des jeux
function GetLstJeux(callback) {

	if (options.verbose) {
		console.log(glb.Time() + ' [LIBMEDIA]\t GetLstJeux : extraction de la liste des Media video');
	}
	
	// recuperation des MEDIA
	db.fetchAll('SELECT id, nomJeux, path, emulator, coverpath FROM jeux ', function(err, result) {
	
		if(err) {
			console.log(glb.Time() + ' [LIBMEDIA]\t GetLstJeux '+err);    
		} else {
		
			if (options.debug) {
				console.log(glb.Time() + ' [LIBMEDIA]\t GetLstJeux '+result);
			}
			callback(result);
		}
	});

}

// recuperation info du jeux
function GetInfoJeux(jeuxID, callback) {

	if (options.verbose) {
		console.log(glb.Time() + ' [LIBMEDIA]\t GetInfoJeux : extraction info jeux '+jeuxID);
	}
	
	// recuperation des MEDIA
	db.fetchAll('SELECT id, nomjeux, path, emulator, coverpath FROM jeux WHERE id = '+jeuxID, function(err, result) {
	
		if(err) {
			console.log(glb.Time() + ' [LIBMEDIA]\t GetInfoJeux '+err);    
		} else {
		
			if (options.verbose) {
				console.log(glb.Time() + ' [LIBMEDIA]\t GetInfoJeux '+result[0]['nomjeux']);
			}
			callback(result);
		}
	});

}

// activation du diapo
function GoDiapo(callback) {
	
	// recuperation une images au hazard
	db.fetchAll("SELECT width, height, path FROM photos ORDER BY random() LIMIT 1", function(err, result) {

		if(err) {
			console.log(glb.Time() + ' [LIBMEDIA]\t GoDiapo '+err);    
		} else {
		
			if (options.debug) {
				console.log(glb.Time() + ' [LIBMEDIA]\t GoDiapo '+result);
			}
			callback(result);
		}
	});
}

// recuperation conf equalizer
function GetConfEqual(callback) {
    
    db.fetchAll('SELECT nomequal, defaut, valeurequal FROM equalizer ORDER BY nomequal DESC', function(err, result) {
                         
        if(err) {
            console.log(glb.Time() + ' [LIBMEDIA]\t GetConfEqual '+err);
		} else {

			// liste des nom equal
			var lstEqual = "";
			var defEqual = "";
			var defReglage = "";
			result.forEach( function(row) {
			
				lstEqual = row['nomequal']+":"+lstEqual;
				
				if ( row['defaut'] == "1" ) {
					defEqual = row['nomequal'];
					defReglage = row['valeurequal'];
				}
			
			});

			var equal = {
					liste: lstEqual,
					def: defEqual,
					reg: defReglage,
				}
			callback(equal);
        
        }
        
        
        
    });
}

// modification Equalizer defaut
function SetConfEqual(equal, callback) {
    
    // mise a zero colonne "defaut"
    db.fetchAll("UPDATE equalizer SET defaut='0'", function(err, result) {
                         
        if(err) {
            console.log(glb.Time() + ' [LIBMEDIA]\t SetConfEqual '+err);
		} else {
		
			// mise à 1 de l'equal par defaut
			db.fetchAll("UPDATE equalizer SET defaut='1' WHERE nomEqual LIKE '"+equal+"'", function(err, result) {
                         
				if(err) {
					console.log(glb.Time() + ' [LIBMEDIA]\t SetConfEqual '+err);
				} else {
					
					callback();
				}
			});
		}
	});
}

// recuperation des itineraire Navit
function GetItiNavit(callback) {

	// liste des fichiers data/navit/conf/iti_*
	fs.readdir('./data/navit/conf', function(err, fichier) {
		
		if (options.debug) {
			console.log(' READIR : '+fichier+" ERR "+err);
		}
		
		var lstIti = "";
		fichier.forEach( function(row) {
		
			if ( row.indexOf("iti-") != -1 ) {
				lstIti = row+":"+lstIti;
			}
		});
		callback(lstIti);
	});

};

// recuperation temps restant VDO
function getTimeRestant(file, callback) {
    
    console.log(glb.Time() + ' [LIBMEDIA]\t getTimeRestant de '+file);
    
    db.fetchAll("SELECT reprise FROM videos WHERE path = '"+file+"'", function(err, result) {
                         
        if(err) {
            console.log(glb.Time() + ' [LIBMEDIA]\t getTimeRestant '+err);
        } else {
            callback(result[0]['reprise']);
        }
    });
}
// mise a jour temps restant VDO
function setTimeRestant(file, time, callback) {
    
    console.log(glb.Time() + ' [LIBMEDIA]\t setTimeRestant de '+file+' : '+time);
    
    db.fetchAll("UPDATE videos SET reprise='"+time+"' WHERE path LIKE '"+file+"'", function(err, result) {
                         
        if(err) {
            console.log(glb.Time() + ' [LIBMEDIA]\t setTimeRestant '+err);
        } else {
            callback();
        }
    });
}

// recuperation des info bluetooth
function getDevBluetooth(callback) {
    
    console.log(glb.Time() + ' [LIBMEDIA]\t getDevBluetooth : recuperation des devices');
    
    db.fetchAll("SELECT name, macid FROM devbluetooth", function(err, result) {
                         
        if(err) {
            console.log(glb.Time() + ' [LIBMEDIA]\t getDevBluetooth '+err);
        } else {
            callback(result);
        }
    });
    
}

// exports des methodes
exports.RecupMedia = RecupMedia;
exports.RecupPL = RecupPL;
exports.RecupPLEnCours = RecupPLEnCours;
exports.RecupInfoTitre = RecupInfoTitre;
exports.GetNextTitre = GetNextTitre;
exports.SetPLEnCours = SetPLEnCours;
exports.RazPlayALL = RazPlayALL;
exports.CreateSelected = CreateSelected;
exports.GetMediaVideo = GetMediaVideo;
exports.GetVideoInfo = GetVideoInfo;
exports.GetLstJeux = GetLstJeux;
exports.GetItiNavit = GetItiNavit;
exports.GetInfoJeux = GetInfoJeux;
exports.GoDiapo = GoDiapo;
exports.GetConfEqual = GetConfEqual;
exports.SetConfEqual = SetConfEqual;
exports.getTimeRestant = getTimeRestant;
exports.setTimeRestant = setTimeRestant;
exports.getDevBluetooth = getDevBluetooth;
