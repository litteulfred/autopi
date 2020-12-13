// insertion des librairies
var DBWrapper = require('node-dbi').DBWrapper,
	_ = require('lodash'),
	glb = require('globalAutoradio'),
	distance = require('gps-distance');
	
var dbConnectionConfig = { host: 'localhost', user: 'pi', password: 'muscadet', database: 'db_gps' };

// mis en place des modes options globales
var defaults = {
    verbose: true,
    debug: false
};
options = _.defaults(defaults);

// Replace the adapter name with "mysql", "mysql-libmysqlclient", "sqlite3" or "pg" on the following line :
db = new DBWrapper( 'pg', dbConnectionConfig );
db.connect( function(err) {

	if (err) {
		console.log(err);
	} else {
		console.log(glb.Time() +' [LIBGPS]\t db connected');
	}

});

// function calcul de distance entre 2 point GPS
function DistanceGPS (latGPS, lonGPS, latSQL, lonSQL, callback) {
  
	var result = distance(latGPS, lonGPS, latSQL, lonSQL);
	
	callback(result);
}

function CheckDistRadar (latGPSD, lonGPSD, callback) {
		
	// recup des infos GPSD
	//var latGPSD = 47.200001;
	//var lonGPSD = 0.18333;
	
	//console.log(glb.Time() +' [libgps]\t CheckDistRadat '+latGPSD+' '+lonGPSD);
	
	var radarProche = { id: 0, lat: 0, lon: 0, maxspeed: 0, distance: 100 };

	// extrapolation des coordonnées sur 1km lat et lon (1km ~= 0.01 dec.)
	var lat1 = parseFloat(latGPSD) - parseFloat(0.9);
	var lat2 = parseFloat(latGPSD) + parseFloat(0.9);
	var lon1 = parseFloat(lonGPSD) - parseFloat(0.9);
	var lon2 = parseFloat(lonGPSD) + parseFloat(0.9);

	// recuperation des Radars
	db.fetchAll("SELECT * FROM speed_camera WHERE lat BETWEEN '"+lat1+"' AND '"+lat2+"' AND lon BETWEEN '"+lon1+"' AND '"+lon2+"'", function(err, result, fields) {
		
		if(err) {
					console.log(' [Check Radar]\t select Radar '+ err);    
		} else {
			
			result.forEach( function(radar) {
				
				// calcul distance du radar
				DistanceGPS (latGPSD, lonGPSD, radar['lat'], radar['lon'], function(distance) {
					
					if ( parseFloat(radarProche['distance']) > parseFloat(distance) ) {
						radarProche['id'] = radar['id'];
						radarProche['lat'] = radar['lat'];
						radarProche['lon'] = radar['lon'];
						radarProche['maxspeed'] = radar['maxspeed'];
						radarProche['distance'] = distance;
					}
					
				});
			});
			callback(radarProche);		
		}
	});
}

function GetPOIbyPOIid (poiID, callback) {

	console.log(' [GetPOIbyPOIid]\t reception recherche pour : '+poiID['lat']+' - '+poiID['lon']+' -- '+poiID['id']+' - '+poiID['distance']);

	// recherche la table de stockage du poiID demande
	db.fetchAll("SELECT source, icon FROM poi WHERE id = '"+poiID['id']+"'", function(err, result, fields) {
		
		if(err) {
					console.log(' [GetPOI]\t select POI with ID ERR '+ err);    
		} else {
		
			if ( result[0]['source'] == 'OSM' ) {
				tableSrc = 'amenity';
			};
			if ( result[0]['source'] == 'EXT' ) {
				tableSrc = 'poiext';
			}
			
			var iconPOI = result[0]['icon'];
			
			console.log(' [GetPOI]\t table : '+tableSrc);
			
			// extrapolation des coordonnées sur poiID['distance'] lat et lon (1km ~= 0.01 dec.)
			var distDec = parseFloat(poiID['distance']) * parseFloat(0.01);
			var lat1 = parseFloat(poiID['lat']) - parseFloat(distDec);
			var lat2 = parseFloat(poiID['lat']) + parseFloat(distDec);
			var lon1 = parseFloat(poiID['lon']) - parseFloat(distDec);
			var lon2 = parseFloat(poiID['lon']) + parseFloat(distDec);
			
			console.log(' [GetPOI]\t carre de recherche '+lat1+","+lon1+" - "+lat2+","+lon2);
			
			cmdSQL = "SELECT * FROM "+tableSrc+" WHERE poiID = '"+poiID['id']+"' AND lat BETWEEN '"+lat1+"' AND '"+lat2+"' AND lon BETWEEN '"+lon1+"' AND '"+lon2+"'";
			db.fetchAll(cmdSQL, function(err, result, fields) {
			
				var lstPOIback = [];
				result.forEach( function(poi) {
				
					// calcul distance du POI
					//console.log(poiID['lat']+","+poiID['lon']+","+poi['lat']+","+poi['lon']);
					DistanceLoc(poiID['lat'], poiID['lon'], poi['lat'], poi['lon'], function(distance) {
					
						distance = parseInt(parseFloat(distance) / parseInt(1000));
						
						if ( parseFloat(distance) < 10 ) {
							distance = '0' + parseInt(distance);
						}
						
						if ( parseFloat(distance) > parseFloat(poiID['distStart']) && parseFloat(distance) < parseFloat(poiID['distance']) ) {

							var tab = distance+"::"+poi['lat']+"::"+poi['lon']+"::"+poi['tags']+"::"+iconPOI;
							lstPOIback.push(tab);
							//console.log(poi['poiID']+" -- "+distance+" -- "+poi['tags']);
						}
					});
				});
				lstPOIback = lstPOIback.sort();
				callback(lstPOIback);
			});
		}
	});
}

function GetPOIbyGRP (poiID, callback) {

	console.log(' [GetPOIbyGRP]\t reception recherche pour : '+poiID['lat']+' - '+poiID['lon']+' -- '+poiID['id']+' - '+poiID['distStart']+' to '+poiID['distance']+' - '+poiID['lstPOIid']);

	var listAll = [];
	
	// creation des requetes en fonction si lstPOIid
	var sqlCMDpoiext = '';
	var sqlCMDamenity = '';
	if ( poiID['lstPOIid'] == 'ALL' ) {
	
		// on recherche par rapport au groupe
		sqlCMDpoiext = "SELECT poiext.lat, poiext.lon, poi.french as type, poiext.tags, poi.icon FROM poi "
					+"INNER JOIN poiext ON poiext.poiID = poi.id "
					+"WHERE visible = '"+poiID['id']+"'";
		sqlCMDamenity = "SELECT amenity.lat, amenity.lon, poi.french as type, amenity.tags, poi.icon FROM poi "
					+"INNER JOIN amenity ON amenity.poiID = poi.id "
					+"WHERE visible = '"+poiID['id']+"'";
	} else {
	
		// création de la clause where
		var clauseWhere = '';
		var tmp = poiID['lstPOIid'].split(".");
		tmp.forEach( function(row) {
			if ( clauseWhere != '' ) {
				clauseWhere = clauseWhere+" OR ";
			}
			clauseWhere = clauseWhere+" poiID = '"+row+"'";
		});
		
		console.log(clauseWhere);
	
		// on recherche les POI en fonction de leur ID directement
		sqlCMDpoiext = "SELECT poiext.lat, poiext.lon, poi.french as type, poiext.tags, poi.icon FROM poiext "
					+"INNER JOIN poi ON poiext.poiID = poi.id "
					+"WHERE "+clauseWhere;
		sqlCMDamenity = "SELECT amenity.lat, amenity.lon, poi.french as type, amenity.tags, poi.icon FROM amenity "
					+"INNER JOIN poi ON amenity.poiID = poi.id "
					+"WHERE "+clauseWhere;
	}
	
	// recherche dans la table 'poiext'
	//var sqlCMD = "SELECT poiext.lat, poiext.lon, poi.french as type, poiext.tags, poi.icon FROM poi "
	//				+"INNER JOIN poiext ON poiext.poiID = poi.id "
	//				+"WHERE visible = '"+poiID['id']+"'";
	db.fetchAll(sqlCMDpoiext, function(err, result, fields) {
	
		if(err) {
					console.log(' [GetPOI]\t select POI with ID ERR '+ err);    
		} else {
				
			var allPOI = result;

			// recherche dans la table 'amenity'
			//var sqlCMD2 = "SELECT amenity.lat, amenity.lon, poi.french as type, amenity.tags, poi.icon FROM poi "
			//		+"INNER JOIN amenity ON amenity.poiID = poi.id "
			//		+"WHERE visible = '"+poiID['id']+"'";
			db.fetchAll(sqlCMDamenity, function(err, result, fields) {
	
				if(err) {
					console.log(' [GetPOI]\t select POI with ID ERR '+ err);    
				} else {
					
					result.forEach(function(row) {
						allPOI.push(row);
					});
					
					// mise au format et calcul distance des POI
					var lstPOIback = [];
					allPOI.forEach( function(poi) {
					
						var iconPOI = poi['icon'];
					
						DistanceLoc(poiID['lat'], poiID['lon'], poi['lat'], poi['lon'], function(distance) {
					
							distance = parseInt(parseFloat(distance) / parseInt(1000));
						
							if ( parseFloat(distance) < 10 ) {
								distance = '0' + parseInt(distance);
							}
						
							//console.log(parseFloat(poiID['distStart'])+' - '+parseFloat(distance)+' - '+parseFloat(poiID['distance']));
							if ( parseFloat(distance) > parseFloat(poiID['distStart']) && parseFloat(distance) < parseFloat(poiID['distance']) ) {

								var tab = distance+"::"+poi['lat']+"::"+poi['lon']+"::"+poi['tags']+"::"+iconPOI;
								lstPOIback.push(tab);
								//console.log(poi['poiID']+" -- "+distance+" -- "+poi['tags']);
							}
						});
					});
					lstPOIback = lstPOIback.sort();
					callback(lstPOIback);
				}
			});
		}
	});
}

function GetAllPOIVF (callback) {

	db.fetchAll("SELECT id, type, french, source, icon, visible, comentaire FROM poi WHERE visible = 'F' OR visible = 'V' ORDER BY french", function(err, result, fields) {
		if(err) {
					console.log(' [GetPOI]\t select ALL POI visible ERR '+ err);    
		} else {

			callback(result);
		}
	});
}

function GetPOIgroup (callback) {

	db.fetchAll("SELECT groupe, titre, visible, icon FROM groupPOI ORDER BY titre", function(err, result, fields) {
		if(err) {
					console.log(' [GetPOIgroup]\t select POI visible ERR '+ err);    
		} else {

			callback(result);
		}
	});
}

//Conversion des degrés en radian
function convertRad(input){
        return (Math.PI * input)/180;
}
 
function DistanceLoc(lat_a_degre, lon_a_degre, lat_b_degre, lon_b_degre, callback){
     
    R = 6378000 //Rayon de la terre en mètre
 
    lat_a = convertRad(lat_a_degre);
    lon_a = convertRad(lon_a_degre);
    lat_b = convertRad(lat_b_degre);
    lon_b = convertRad(lon_b_degre);
     
    d = R * (Math.PI/2 - Math.asin( Math.sin(lat_b) * Math.sin(lat_a) + Math.cos(lon_b - lon_a) * Math.cos(lat_b) * Math.cos(lat_a)))
    callback(d);
}

// recherche des POI d un groupe
function GetPOIonGRP(grpID, callback) {

	db.fetchAll("SELECT id, french, icon, comentaire FROM poi WHERE visible = '"+grpID+"'", function(err, result, fields) {
	
		if(err) {
					console.log(' [GetPOI]\t select POI with ID ERR '+ err);    
		} else {

			callback(result);
			
		}
	});
}

// exports des methodes
exports.DistanceGPS = DistanceGPS;
exports.CheckDistRadar = CheckDistRadar;
exports.GetPOIbyPOIid = GetPOIbyPOIid;
exports.GetPOIgroup = GetPOIgroup;
exports.GetAllPOIVF = GetAllPOIVF;
exports.GetPOIbyGRP = GetPOIbyGRP;
exports.GetPOIonGRP = GetPOIonGRP;
