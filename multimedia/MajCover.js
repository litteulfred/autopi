var coverArt = require('cover-art'),
	wget = require('node-wget'),
	glb = require('globalAutoradio'),
	fs = require('fs'),
	DBWrapper = require('node-dbi').DBWrapper,
	path = require('path'),
	child_process = require('child_process'),
	ini = require('ini');

/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8', function(err) {
	if (err) {
		console.log(glb.Time() + ' [MULTIMEDIA]\t ERR ecriture '+err);
	}
});
 
//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);

/* ----------------------------------------------------- */
/* fonction                                              */
/* ----------------------------------------------------- */
// mise à jour BDD
function majBDD(id, target) {
	
	var db1 = new DBWrapper( 'pg', {
		host     : config.database.host,
	 	user     : config.database.user,
	  	password : config.database.password,
	  	database : config.database.database
	});
	db1.connect( function(err) {

		if (err) {
			console.log(glb.Time() + ' [MAJCOVER]\t Error connecting database DB1...'+err);
			process.exit(1);
		} else {
			console.log(glb.Time() + ' [MAJCOVER]\t DB1 Database is connected ...');
	
			var sql = "UPDATE albums SET coverPath = '"+target+"' WHERE id = "+id+";";
			db1.fetchAll(sql, function(err, result) {
									
				if(err) {
					console.log(glb.Time() + ' [MAJCOVER]\t ERR mise à jour BDD '+err);    
				} else {
		
					if (config.MajCover.verbose) {
						console.log(glb.Time() + ' [MAJCOVER]\t OK mise a jour BDD '+result);
					}
				}
			});
		}
	});
	db1.close();

}	

/* ----------------------------------------------------- */
/* recuperation liste des album par artistes             */
/* ----------------------------------------------------- */
// recuperation des Album par artists
db = new DBWrapper( 'pg', {
	host     : config.database.host,
 	user     : config.database.user,
  	password : config.database.password,
  	database : config.database.database
});
db.connect( function(err) {

	if (err) {
		console.log(glb.Time() + ' [MAJCOVER]\t Error connecting database ...'+err);
		process.exit(1);
	} else {
		console.log(glb.Time() + ' [MAJCOVER]\t Database is connected ...');
	}

});

db.fetchAll('SELECT albums.id, artists.nomArtist, albums.nomAlbum FROM albums '+
				'INNER JOIN artists on artists.id = albums.artistsID ', function(err, result) {
	
	if(err) {
		console.log(glb.Time() + ' [MAJCOVER]\t ERR recuperation albums '+err);    
	} else {
		
		if (config.MajCover.verbose) {
			console.log(glb.Time() + ' [MAJCOVER]\t recuperation albums '+result);
		}
		
		result.forEach( function(row, index, array) {
		
			Artist = glb.Replace(row['nomartist']);
			Album = glb.Replace(row['nomalbum']);
		
			var imgTarget = config.MajCover.repCover+"/"+Artist+"."+Album+".png"
			
			// test si le cover est déjà présent
			
			fs.exists(imgTarget, function(exist) {

				if (exist) {
					
					if (config.MajCover.verbose) {
						console.log(glb.Time() + ' [MAJCOVER]\t fichier '+imgTarget+' existant');
					}
					
					majBDD(row['id'], imgTarget);
				
				} else {
						
					if (config.MajCover.verbose) {
						console.log(glb.Time() + ' [MAJCOVER]\t fichier '+imgTarget+' absent, telechargement');
					}		
					
					// recherche album et telechargement
					coverArt(row['nomartist'], row['nomalbum'], 'extralarge', function (err, url) {
   	
   						// si on trouve le cover, on le charge
						if ( url ) {
						
							if (config.MajCover.verbose) {
								console.log(glb.Time() + ' [MAJCOVER]\t fichier '+imgTarget+' absent, WGET');
							}
						
							wget(url, function() {
							
								if (config.MajCover.verbose) {
									console.log(glb.Time() + ' [MAJCOVER]\t telechargement termine');
									console.log(glb.Time() + ' [MAJCOVER]\t rename '+path.basename(url)+' '+imgTarget);
								}
								fs.rename(path.basename(url), imgTarget, function(err) {
						
									if (err) {
										console.log(glb.Time() + ' [MULTIMEDIA]\t ERR ecriture '+err);
									}
									
									// creation thumbnail
									var convert = child_process.exec('convert '+imgTarget+' -resize 50x50 '+imgTarget+'.THUMB');
									convert.stdout.on('data', function (data) {
										console.log('INFO CONVERT '+data);	
									});
									convert.stderr.on('data', function (data) {
										console.log('ERROR CONVERT '+data);	
									});
									
								});
								
								majBDD(row['id'], imgTarget);

							});
						
						// si on ne trouve pas le cover, on laisse le defaut
						} else {
						
							if (config.MajCover.verbose) {
								console.log(glb.Time() + ' [MAJCOVER]\t album non trouvé, mise en place defCover');
							}
							
						}
						
					});
				}		
			});

		console.log(index);
		});
		console.log('END');
	}
});


// Photo artist seul
//coverArt('The Beatles', function (err, url) {
//    console.log(url);
//    wget(url);
    //=> http://path/to/beatles.jpg 
//});