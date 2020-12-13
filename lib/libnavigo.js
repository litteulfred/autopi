 var _ = require('lodash'),
	DBWrapper = require('node-dbi').DBWrapper,
	glb = require('globalAutoradio'); 

var dbConnectionConfig = { host: 'localhost', user: 'pi', password: 'muscadet', database: 'db_gps' };

// mis en place des modes options globales
var defaults = {
    verbose: true,
    debug: false
};
options = _.defaults(defaults);

// Replace the adapter name with "mysql", "mysql-libmysqlclient", "sqlite3" or "pg" on the following line :
dbGPS = new DBWrapper( 'pg', dbConnectionConfig );
dbGPS.connect( function(err) {

	if (err) {
		console.log(err);
	} else {
		console.log(glb.Time() +' [LIBNAVIGO]\t db global connected');
	}

});

// connexion SQL pour requete donnee cinetique
// --------------------------------------------
dbCine = new DBWrapper( 'pg', dbConnectionConfig );
dbCine.connect( function(err) {

	if (err) {
		console.log(err);
	} else {
		console.log(glb.Time() +' [LIBNAVIGO]\t db cinematique connected');
	}

});


// connexion SQL pour requete param
// ---------------------------------
dbParam = new DBWrapper( 'pg', dbConnectionConfig );
dbParam.connect( function(err) {

	if (err) {
		console.log(err);
	} else {
		console.log(glb.Time() +' [LIBNAVIGO]\t db param connected');
	}

});


function getJsonRoute (callback) {
	
	// on verifie si routeencours est présent avec au moins 1 ligne
	dbGPS.fetchAll("select count(*) from routeencours", function(err, res) {
	
		if (err) {
			callback('NONE');
		} else {
		
            console.log(glb.Time() +' [LIBNAVIGO]\t getJsonRoute - recuperation de la route');
        
			if ( res[0]['count'] != '0' ) {
	
 
                var req = "SELECT ST_AsGeoJSON(ST_UNION(ST_AsText(ST_Transform(a.the_geom, 3857)))) as jsonRoute FROM "+options.carte+"_ways_light AS a INNER JOIN routeencours AS b ON b.edge = a.gid;";
                console.log(glb.Time() +' [LIBNAVIGO]\t getJsonRoute - '+req);
				//db.fetchAll("select ST_AsGeoJSON(ST_UNION(ST_AsText(ST_Transform(the_geom, 3857)))) as jsonRoute from routeencours;", null, function(err, result) {
                dbGPS.fetchAll(req, null, function(err, result) {

					if (err) {
						console.log(err);
					} else {

						var res = result[0]['jsonroute'];
						tags = JSON.parse(res);
						callback(tags);
					}
				});
			} else {
				callback('NONE');
			}
		}
	});
}

function getJsonTmpWays (callback) {
	
	dbGPS.fetchAll("select ST_AsGeoJSON(ST_UNION(ST_AsText(ST_Transform(the_geom, 3857)))) as jsonRoute from tmpways;", null, function(err, result) {

		if (err) {
			console.log(err);
		} else {

			var res = result[0]['jsonroute'];
			tmpways = JSON.parse(res);
			callback(tmpways);
		}
	});
}

// fonction de recherche des villes
function getVille(character, pays, callback) {

	//dbParam.fetchAll("SELECT nom, code_dept as code_postal, lon_centro as lattarget, lat_centro as lontarget FROM communes_plus WHERE lower(translate(nom,"
	dbParam.fetchAll("SELECT name, departement as code_postal, st_Y(ST_astext(ST_transform(way, 4326))) as lattarget, st_X(ST_astext(ST_transform(way, 4326))) as lontarget FROM "+pays+"_city WHERE lower(translate(name,"
		+"'âãäåÁÂÃÄÅèééêëÈÉÉÊËìíîïìÌÍÎÏÌóôõöÒÓÔÕÖùúûüÙÚÛÜ',"
		+"'aaaaAAAAAeeeeeEEEEEiiiiiIIIIIooooOOOOOuuuuUUUU')) LIKE '"+character+"%' ORDER BY name LIMIT 9", function(err, result) {
	
		if (err) {
			console.log(err);
		} else {

			//	lattarget / lontarget
			callback(result);
		}
	});

};

// fonction de recherche itineraire
function roadByDijkstraByDirect(options, callback) {

	var offset = 0.5;
	
	// x1 y1 : coin haut gauche, x2 y2 : coin bas droite
			
    // creation des coordonnees du polygone de recherche
    if ( options.src_x < options.trg_x ) {
        x1 = parseFloat(options.src_x) - offset;
        x2 = parseFloat(options.trg_x) + offset;
    } else {
        x1 = parseFloat(options.src_x) + offset;
        x2 = parseFloat(options.trg_x) - offset;
    }
    if ( options.src_y < options.trg_y ) {
        y1 = parseFloat(options.src_y) - offset;
        y2 = parseFloat(options.trg_y) + offset;
    } else {
        y1 = parseFloat(options.src_y) + offset;
        y2 = parseFloat(options.trg_y) - offset;
    }
	


	// suppression de la table routeEnCours
	console.log(glb.Time() +' [roadByDijkstraByDirect]\t '+options.carte+' - table "routeencours" source:'+options.src_vertice+' target:'+options.trg_vertice);
	dbGPS.fetchAll("TRUNCATE TABLE routeencours;", null, function(err, result) {

		if (err) {
			console.log(glb.Time() +' [roadByDijkstraByDirect]\t '+err);
		} else {
		
			console.log(glb.Time() +' [roadByDijkstraByDirect]\t truncate table "routeencours" OK ');
			
			// creation table routeencours et insertion des données de route	
			var waysSQL = "SELECT gid as id, source, target, cost_s * penalty AS cost, reverse_cost_s * penalty AS reverse_cost, the_geom "
					+"FROM "+options.carte+"_ways_all JOIN osm_way_classes USING (class_id) "
					+"WHERE (SELECT st_within(the_geom,"
					+"ST_GeomFromText(''POLYGON(("+x1+" "+y1+", "+x2+" "+y1+", "+x2+" "+y2+", "+x2+" "+y1+", "+x1+" "+y1+"))'', 4326))) = true"
			
			// generation table tmpways2
			//db.fetchAll("DROP TABLE tmpways2;", null, function(err, result) {

				//if (err) {
					//console.log(glb.Time() +' [newRoadByDijkstra]\t '+err);
				//} //else {
			
					//console.log(glb.Time() +' [roadByDijkstraByDirect]\t drop table "tmpways2" OK ');
					//db.fetchAll("CREATE TABLE tmpways2 AS "+waysSQL+";", null, function(err, result) {

						//if (err) {
							//console.log(glb.Time() +' [newRoadByDijkstra]\t '+err);
						//} else {
			
							//console.log(glb.Time() +' [newRoadByDijkstra]\t create table "tmpways2" OK ');
			
							/* avec prise en compte des penalty autoroute */
							//var cmdSQL = "CREATE TABLE routeencours AS"
							var cmdSQL = "INSERT INTO routeencours (seq, path_seq, node, edge, cost, agg_cost) "
								+" SELECT * FROM"
								+" pgr_dijkstra("
									+"'"+waysSQL+"',"
									+options.src_vertice+","
									+options.trg_vertice+","
									+"true"
								+")"
								//+" AS a LEFT JOIN "+options.carte+"_ways_all as b ON (a.edge = b.gid) ORDER BY seq;";

							dbGPS.fetchAll(cmdSQL, null, function(err, result) {

								if (err) {
									console.log(glb.Time() +' ERROR SQL : '+err);
									callback();
								} else {
                                        console.log(glb.Time() +' [roadByDijkstraByDirect]\t creation et insertion table "routeencours" terminee '+result);
									
                                        // ajout des GEOM sur route en cours
                                        
                                        callback();
								}
							});
				
						//}
					//});
				//}
			
			//})
		}
	})
}

// fonction de recherche itineraire
function roadByDijkstraByTempo(param, callback) {

	// suppression de la table routeEnCours
	console.log(glb.Time() +' [roadByDijkstraByTempo]\t table "routeencours" source:'+param['src_vertice']+' target:'+param['trg_vertice']);
	dbGPS.fetchAll("TRUNCATE TABLE routeencours;", null, function(err, result) {

		if (err) {
			console.log(glb.Time() +' [roadByDijkstraByTempo]\t '+err);
		} else {
		
			console.log(glb.Time() +' [roadByDijkstraByTempo]\t truncate table "routeencours" OK ');
			
			// creation table routeencours et insertion des données de route	
            var waysSQL = "SELECT gid as id, source, target, cost_s * priority AS cost, reverse_cost_s * priority AS reverse_cost "
					+"FROM tmpways" // JOIN osm_way_classes USING (class_id) "
					//+"WHERE the_geom @ (SELECT ST_buffer(the_geom,"+param['bbox']+") FROM tmpWays WHERE gid= "+param['troncon']+" )"
		
			/* avec prise en compte des penalty autoroute */
			//var cmdSQL = "CREATE TABLE routeencours AS"
            var cmdSQL = "INSERT INTO routeencours (seq, path_seq, node, edge, cost, agg_cost) "
                    +" SELECT * FROM"
					+" pgr_dijkstra("
						+"'"+waysSQL+"',"
						+param['src_vertice']+","
						+param['trg_vertice']+","
						+"true"
                    +")";
                    //+" AS a LEFT JOIN tmpways as b ON (a.edge = b.gid) ORDER BY seq;";

            console.log('----> '+cmdSQL);

			dbGPS.fetchAll(cmdSQL, null, function(err, result) {

				if (err) {
					console.log(glb.Time() +' ERROR SQL : '+err);
					callback();
				} else {
					console.log(glb.Time() +' [roadByDijkstraByTempo]\t creation et insertion table "routeencours" terminee '+result);
					callback();
				}
			});
		}
	});
}

function getVerticeID(x1, y1, callback) {

	//console.log(glb.Time() +' [libnavigo]\t getVerticeID - '+x1+', '+y1);

	dbCine.fetchAll("SELECT id FROM "+options.carte+"_ways_vertices_pgr ORDER BY the_geom <-> ST_SetSRID(ST_Point("+x1+","+y1+"),4326) LIMIT 1", function(err, result) {

		if (err) {
			console.log(err);
		} else {
			var verticeID = result[0]['id'];
			callback(verticeID);
		}
	});
}

function createWaysPoly(options, callback) {

	console.log(glb.Time() +' [libnavigo]\t  createWaysPoly - creation polygone recherche (table tmpways) ');

    var offset = 0.5;

    // creation des coordonnees du polygone de recherche
    if ( options.src_x < options.trg_x ) {
        x1 = parseFloat(options.src_x) - offset;
        x2 = parseFloat(options.trg_x) + offset;
    } else {
        x1 = parseFloat(options.src_x) + offset;
        x2 = parseFloat(options.trg_x) - offset;
    }
    if ( options.src_y < options.trg_y ) {
        y1 = parseFloat(options.src_y) - offset;
        y2 = parseFloat(options.trg_y) + offset;
    } else {
        y1 = parseFloat(options.src_y) + offset;
        y2 = parseFloat(options.trg_y) - offset;
    }
    
//    console.log(glb.Time() +' [libnavigo]\t  createWaysPoly - suppression table tmpWays ');
    dbGPS.fetchAll("DROP TABLE IF EXISTS tmpways", function(err, result) {
                
        if (err) {
            console.log(err);
        } else {
                                
            var peageClause = '';
            if ( options.peage == 'off' ) {
                console.log(glb.Time() +' [libnavigo]\t  createWaysPoly - suppression des peages ');
                peageClause = "AND ( toll IS NULL OR toll = 'no' )";
            }
                                
            console.log(glb.Time() +' [libnavigo]\t  createWaysPoly - creation table tmpWays '+x1+" "+y1+", "+x2+" "+y1+", "+x2+" "+y2+", "+x2+" "+y1+", "+x1+" "+y1);
            var req = "CREATE TABLE tmpways AS select gid, source, target, cost_s, reverse_cost_s, priority from "+options.carte+"_ways_light WHERE (SELECT "
                                +"st_within(the_geom, "
                                +"ST_GeomFromText("
                                +"'POLYGON(("+x1+" "+y1+", "+x2+" "+y1+", "+x2+" "+y2+", "+x2+" "+y1+", "+x1+" "+y1+"))',"
                                +"4326))) = true "+peageClause
                                    
            dbGPS.fetchAll(req, function(err, result) {
                                                
                if (err) {
                    console.log(err);
                } else {
                                                
                    console.log(glb.Time() +' [libnavigo]\t  createWaysPoly - fin de creation tmpWays ');
                    var retour = { x1: x1, y1: y1, x2: x2, y2: y2 }                            
                    callback(retour);
                                                
                }
            })
        }
    })
}

function getTroncon(vertice, callback) {
	
	if ( options.verbose ) {
		console.log(glb.Time() +' [LIBNAVIGO]\t recuperation du troncon, vertice : '+vertive);
	}
	dbGPS.fetchAll("SELECT gid as legid FROM ways WHERE source = "+vertice+" LIMIT 1", null, function(err, result) {

		if (err) {
			console.log(err);
		} else {
			callback(result[0]['legid']);
		}
	});
}

function getDistance(x, y, callback) {

	dbGPS.fetchAll("SELECT ST_Distance( "
			+"ST_Transform(ST_GeomFromText('POINT("+x+" "+y+")',4326),26986), "
			//+"ST_Transform((select ST_Union(the_geom) from routeencours),26986)"
            +"ST_Transform((select ST_Union(a.the_geom) from "+options.carte+"_ways_light AS a INNER JOIN routeencours AS b ON b.edge = a.gid),26986)"
		+");", function(err, result) {
		
		if (err) {
			console.log(err);
		} else {
			//console.log(result);
			callback(result[0]['st_distance']);
		}
	});

}

// recuperation de la seq en cours sur la route
function getSeqRouteencours(vertice, callback) {

	dbGPS.fetchAll("SELECT seq from routeencours where node = "+vertice+";", function(err, result) {
		
		if (err) {
			console.log(err);
		} else {
			//console.log(result[0]['anonymous']);
			var res = result[0]['seq'];
			callback(res);
		}
	});
}

// conversion des seconde en heure / minute
function conversion_seconde_heure(time) {

	var reste=time;
	var result='';
 
	var nbJours=Math.floor(reste/(3600*24));
	reste -= nbJours*24*3600;
 
	var nbHours=Math.floor(reste/3600);
	reste -= nbHours*3600;
 
	var nbMinutes=Math.floor(reste/60);
	reste -= nbMinutes*60;
 
//	var nbSeconds=reste;
 
	if (nbJours>0)
	result=result+nbJours+'j ';
 
	if (nbHours>0)
		result=result+nbHours+'h';
 
	if (nbMinutes>0)
		result=result+nbMinutes+'m';
 
//	if (nbSeconds>0)
//		result=result+nbSeconds+'s ';
 
	return result;
}

// recuperation de la seq et du temps ecoule
function getSeqTimeVertice(vertice, callback) {

	// on verifie si routeencours est présent avec au moins 1 ligne
	dbCine.fetchAll("select count(*) from routeencours", function(err, res) {
	
		if (err) {
			var res = { agg_cost: '0' };
			callback(res);
		} else {
		
			dbCine.fetchAll("select seq, agg_cost from routeencours where node = "+vertice+";", function(err, result) {
	
				if (err) {
					console.log(err);
				} else {
					//console.log(result[0]['anonymous']);
					var res = result[0];
					callback(res);
				}
			})
		}
	})
}

// recuperation des donnees trajets
function getDataRouteencours(callback) {

	// on verifie si routeencours est présent avec au moins 1 ligne
	dbCine.fetchAll("select count(*) from routeencours", function(err, res) {
	
		if (err) {
			callback('NONE');
		} else {

			if ( res[0]['count'] != '0' ) {
			
				// recuperation distance totale
				dbCine.fetchAll("SELECT sum(a.length_m) /1000 as distkm FROM "+options.carte+"_ways_data as a INNER JOIN routeencours as b on a.gid = b.edge", function(err, result) {
	
					if (err) {
						console.log(err);
					} else {

						var resKm = result[0];
						
						// recuperation temps total
						dbCine.fetchAll("select agg_cost from routeencours where edge = -1;", function(err, result) {
	
							if (err) {
								console.log(err);
							} else {
						
								var resTps = result[0];
								
								resultat = {
									distkm: resKm['distkm'],
									tpsTot: resTps['agg_cost']
								}
								callback(resultat);
							}
						})
					}
				})
				
			} else {
				callback('NONE');
			}
		}
	})

}

// calcul distance restante
function getDistRestRouteencours(seq, callback) {

	// on verifie si routeencours est présent avec au moins 1 ligne
	dbCine.fetchAll("select count(*) from routeencours", function(err, res) {
	
		if (err) {
			var res = { distkm: '0' };
			callback(res);
		} else {

			// recuperation du nombre de sequence
			dbCine.fetchAll("select seq from routeencours order by seq desc limit 1", function(err, res) {
	
				if (err) {
					console.log("select seq : "+err);
				} else {
		
					var sql = "SELECT sum(a.length_m) /1000 as distkm FROM "+options.carte+"_ways_data as a"
						+" INNER JOIN routeencours as b on a.gid = b.edge"
						+" WHERE b.seq between "+seq+" AND "+res[0]['seq'];

					dbCine.fetchAll(sql, function(err, result) {
	
						if (err) {
							console.log("SELECT sum : "+err);
						} else {
							//console.log(result[0]['anonymous']);
							var dist = result[0];
							callback(dist);
						}
					})
				}
			})
		}
	})
}

// calcul prochaine route
function getNextRoad(seq, callback) {

    // on verifie si routeencours est présent avec au moins 1 ligne
    dbCine.fetchAll("select count(*) from routeencours", function(err, res) {
    
        if (err) {
            var res = { distkm: '0' };
            callback(res);
        } else {

            // recuperation du nombre de sequence
            dbCine.fetchAll("select seq from routeencours order by seq desc limit 1", function(err, res) {
    
                if (err) {
                    console.log("select seq : "+err);
                } else {
                
                    var sql = "SELECT b.seq, a.ref, a.name, a.length_m,  ST_AsText(ST_StartPoint(the_geom)) as ptstart, ST_AsText(ST_EndPoint(the_geom)) as ptend, degrees(ST_Azimuth(ST_StartPoint(the_geom), ST_EndPoint(the_geom))) AS azimuth FROM "+options.carte+"_ways_data AS a "
                        +"INNER JOIN routeencours AS b on a.gid = b.edge "
                        +"WHERE b.seq BETWEEN "+seq+" AND "+res[0]['seq']
                        +" ORDER BY b.seq;";
                    
                    dbCine.fetchAll(sql, function(err, res) {
    
                        if (err) {
                            console.log("select seq : "+err);
                        } else {
                            callback(res);
                        }
                    })
                }
            })
        }
    })

}

// recuperation info sur la position du mobil
function getDataVertice(vertice, callback) {
	
	dbGPS.fetchAll("SELECT ref, name, maxspeed_forward FROM tmpways WHERE source ="+vertice+";", function(err, result) {
	
		if (err) {
			console.log(err);
		} else {
			//console.log(result[0]['anonymous']);
			var res = result[0];
			callback(res);
		}
	
	})
}

// recuperation rue et km max de la position
function getDataMobil(x1, y1, callback) {

	dbCine.fetchAll("SELECT maxspeed_forward, name, ref FROM "+options.carte+"_ways_data ORDER BY the_geom <-> ST_SetSRID(ST_Point("+x1+","+y1+"),4326) LIMIT 1", function(err, result) {
		if (err) {
			console.log('getDataMobil '+err);
		} else {
			//console.log(result[0]['anonymous']);
			var res = result[0];
			callback(res);
		}
	})
}
		
// recuperation des param GPS
function getParamGPS(callback) {

	dbParam.fetchAll("SELECT * FROM paramgps ORDER BY id;", function(err, result) {
	
		if (err) {
			console.log(err);
		} else {
			callback(result);
		}
	})
}

// changement des param GPS
function setParamGPS(param) {

	console.log(glb.Time() +' [LIBNAVIGO]\t setParamGPS - '+param['id']+' '+param['type']);

	var newValeur;
	if ( param['type'].indexOf("onoff") != -1 ) {
		
		// on recupere ancienne valeur et on switch
		dbParam.fetchAll("SELECT valeur FROM paramgps WHERE id = '"+param['id']+"'", function(err, result) {
		
			if (err) {
				console.log(err);
			} else {

				if ( result[0]['valeur'] == 'on' )
					newValeur = 'off';
				
				if ( result[0]['valeur'] == 'off' )
					newValeur = 'on';
				
				dbParam.fetchAll("UPDATE paramgps SET valeur = '"+newValeur+"' WHERE id = '"+param['id']+"';", function(err, result) {
	
					if (err) {
						console.log(err);
					} else {
						console.log(glb.Time() +' [LIBNAVIGO]\t setParamGPS - changement parametre '+param['id']+' - '+newValeur);
					}
				})
			}
		})	
	}
	if ( param['type'].indexOf("switch") != -1 ) {
		
		dbParam.fetchAll("UPDATE paramgps SET valeur = '"+param['valeur']+"' WHERE id = '"+param['id']+"';", function(err, result) {
	
			if (err) {
				console.log(err);
			} else {
				console.log(glb.Time() +' [LIBNAVIGO]\t setParamGPS - changement parametre '+param['id']+' - '+param['valeur']);
			}
		})
	}
}

// conversion de coordonnee DMS en degre
function convertDMStoDEG(lat, lon, postal, callback) {

    if ( postal == 'dms' ) {
    
        var lattmp = lat.split(':');
        var lontmp = lon.split(':');
                    
        var latdeg = parseFloat(lattmp[0])+(parseFloat(lattmp[1]/parseFloat(60)))+(parseFloat(lattmp[2]/parseFloat(3600)));
        var londeg = parseFloat(lontmp[0])+(parseFloat(lontmp[1]/parseFloat(60)))+(parseFloat(lontmp[2]/parseFloat(3600)));

        if ( lontmp[3] == 'W' )
            londeg = parseFloat(londeg) * parseFloat(-1);
        if ( lat[3] == 'S' )
            latdeg = parseFloat(latdeg) * parseFloat(-1);        
        console.log(glb.Time() +' [LIBNAVIGO]\t convertDMStoDEG - transformation coordonnee GPS '+lat+'='+latdeg+', '+lon+'='+londeg);
        callback(latdeg, londeg);
    
    } else {
        callback(lat, lon);
    }

}

// mise a jour table itineraire
function setItineraire(options, callback) {

	console.log(glb.Time() +' [LIBNAVIGO]\t setItineraire - '+options.trg_ville);

	// suppression du contenu de la table
	dbGPS.fetchAll("TRUNCATE TABLE itineraire;", function(err, result) {

		if (err) {
			console.log(err);
		} else {
				
            // insertion en table
            dbGPS.fetchAll("INSERT INTO itineraire VALUES ('1','"+options.trg_ville+"','"+options.trg_postal+"','"+options.trg_vertice+"',"+options.trg_x+","+options.trg_y+");", function(err, result) {
					
                if (err) {
                    console.log(err);
                }
            })
		}
	})
}

// historisation itineraire
function histoIti (options) {

    console.log(glb.Time() +' [LIBNAVIGO]\t histoIti - '+options.trg_ville);

	// recuperation de la date
	var date = glb.Time().split('-');
	date[0] = date[0].replace(/\//g, '-');

	dbParam.fetchAll("INSERT INTO historique_iti (date, ville, postal, x, y) VALUES ('"+date[0]+"','"+options.trg_ville+"','"+options.trg_postal+"','"+options.trg_x+"','"+options.trg_y+"');", function(err, result) {		
		if (err) {
			console.log(err);
		}
	})

}

// recuperation historique des recherches
function getHisto (callback) {

    console.log(glb.Time() +' [LIBNAVIGO]\t getHisto - recuperation de l historique');
    
    dbParam.fetchAll("SELECT * FROM historique_iti ORDER BY date DESC LIMIT 15;", function(err, result) {        
        if (err) {
            console.log(err);
        } else {
            callback(result)
        }
    })

}

// fonction de recuperation de la destination suivante
function getNextDestination(callback) {

	dbGPS.fetchAll("SELECT * FROM itineraire WHERE id = '1';", function(err, result) {

		if (err) {
			console.log(err);
		} else {

			var troncon = result[0];
			callback(troncon);
		}
	})
}

// recuperation des groupes POI
function getPOIgroup(callback) {

	dbParam.fetchAll("SELECT * FROM poi_group WHERE visible = true;", function(err, poigroup) {

		if (err) {
			console.log(err);
		} else {

			//var poigroup = result[0];
			callback(poigroup);
		}
	})
}

// recuperation du sous groupe
function getPOIsousgroup(groupid, callback) {
	
	dbParam.fetchAll("SELECT * FROM poi_sous_group WHERE visible = true AND groupid = '"+groupid+"';", function(err, poigroup) {

		if (err) {
			console.log(err);
		} else {

			//var poigroup = result[0];
			callback(poigroup);
		}
	})
}

// recuperation des poi
function getPOI(groupid, x, y, callback) {

	var deltaDist = '0 AND 50000';

	dbParam.fetchAll("SELECT a.lat, a.lon, a.tags, b.nom, b.icon, ST_Distance("
			+"ST_Transform(ST_GeomFromText('POINT(' || a.lat || ' ' || a.lon || ')',4326),26986),"
			+"ST_Transform(ST_GeomFromText('POINT(47.200001 0.18333)',4326),26986)"
			+") as dist "
		+"FROM poi_list as a "
		+"INNER JOIN poi_sous_group as b ON a.sous_groupid = b.id "
		+"INNER JOIN poi_group as c on b.groupid = c.id "
		+"WHERE c.id = "+groupid+" "
			+"AND b.visible = true "
			+"AND ST_Distance("
				+"ST_Transform(ST_GeomFromText('POINT(' || a.lat || ' ' || a.lon || ')',4326),26986),"
				+"ST_Transform(ST_GeomFromText('POINT("+y+" "+x+")',4326),26986)) "
				+"BETWEEN "+deltaDist+" "
		+"ORDER BY dist", function(err, result) {
	
		if (err) {
			console.log(err);
		} else {

			callback(result);
		}
	})
}

// suppression route en cours
function razRouteEnCours() {
	dbGPS.fetchAll("TRUNCATE TABLE routeencours;", null, function(err, result) {

		if (err) {
			console.log(glb.Time() +' [razRouteEnCours]\t '+err);
		}
	})
}

// recuperation des favoris
function getFavoris(callback) {
	dbParam.fetchAll("SELECT * FROM favoris;", function(err, result) {

		if (err) {
			console.log(glb.Time() +' [razRouteEnCours]\t '+err);
		} else {
			callback(result);
		}
	})
}

exports.getJsonRoute = getJsonRoute;
exports.getVille = getVille;
exports.getVerticeID = getVerticeID;
exports.getTroncon = getTroncon;
exports.createWaysPoly = createWaysPoly;
exports.roadByDijkstraByTempo = roadByDijkstraByTempo;
exports.getDistance = getDistance;
exports.getSeqRouteencours = getSeqRouteencours;
exports.getJsonTmpWays = getJsonTmpWays;
exports.conversion_seconde_heure = conversion_seconde_heure;
exports.getSeqTimeVertice = getSeqTimeVertice;
exports.getDataVertice = getDataVertice;
exports.getParamGPS = getParamGPS;
exports.setParamGPS = setParamGPS;
exports.getDistRestRouteencours = getDistRestRouteencours;
exports.getDataMobil = getDataMobil;
exports.setItineraire = setItineraire;
exports.getNextDestination = getNextDestination;
exports.getPOIgroup = getPOIgroup;
exports.getPOIsousgroup = getPOIsousgroup;
exports.getPOI = getPOI;
exports.getDataRouteencours = getDataRouteencours;
exports.razRouteEnCours = razRouteEnCours;
exports.histoIti = histoIti;
exports.getHisto = getHisto;
exports.getFavoris = getFavoris;
exports.roadByDijkstraByDirect = roadByDijkstraByDirect;
exports.convertDMStoDEG = convertDMStoDEG;
exports.getNextRoad = getNextRoad;
