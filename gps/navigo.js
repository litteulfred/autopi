// insertion des librairies
var	_ = require('lodash'),
    fs = require('fs'),
    glb = require('globalAutoradio'),
    Nav = require('../lib/libnavigo.js'),
    Media = require('../lib/libmedia.js'),
    ini = require('ini'),
    os = require('os'),
    sockGPS = require('socket.io-client')('http://localhost:8122');
    ioClient = require('socket.io-client');

/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8');

//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);

// mis en place des modes options globales
var defaults = {
    carte: 'france',
    src_x: '0.1841',
//    src_x: '1.312939',
    src_y: 47.200001,
//    src_y: '51.123132',
    src_vertice: '',
    trg_ville: '',
    trg_postal: '',
    trg_vertice: '',
    trg_x: '',
    trg_y: '',
    trg_disttot: '',
    trg_tpstot: '',
    trg_tpstotsec: '',
    arrTime:'',
    tpsrestant: '',
    modeSearch: '',
    peage: '',
    distNextRoad: 0, 
};
options = _.defaults(defaults);
var defflag = {
    trajetEnCours: false,
    searchVille: false,
    nextsearchVille: 'none'
}
flag = _.defaults(defflag);

/* ----------------------------------------------------- */
/* serveur SOCKET                                        */
/* ----------------------------------------------------- */
if (config.GPS.verbose) {
    console.log(glb.Time() +' [GPS]\t Activation du serveur SOCKET');
}
var io = require('socket.io').listen('8125');
io.sockets.on('connection', function (socket) {
              
    if (config.GPS.verbose) {
        console.log(glb.Time() +' [GPS]\t connection IHM cliente');
    }

    // envoi de la map a creer
    // -----------------------
    var host = os.hostname();
    if ( host == 'autopi' )
        socket.emit('MAP', 'TILE');
    if ( host == 'Dev-Debian' )
        socket.emit('MAP', 'WEB');
              
    // DATAGPS - reception des data GPS
    // --------------------------------
    var timePrec = '0';
    var timePrecNextRoad = 0;
    sockGPS.on('DATAGPS', function(datagps) {
        
        if ( datagps.vitesse != '-' ) {
                         
            if (config.GPS.debug) {
                console.log(glb.Time() +' [GPS]\t reception data GPSD ');
            }
                         
            // mise en place variable globale
            options.src_x = datagps['xPosit'];
            options.src_y = datagps['yPosit'];
                         
            // envoi des coordonnees pour deplacer carte et mobile
            socket.emit('GPSD', datagps); 
            
            if ( flag.trajetEnCours ) {
            
                var t = new Date();
                var time = t.getTime();
                deltaTime = parseInt(time) - parseInt(timePrec);
                deltaTimeNextRoad = parseInt(time) - parseInt(timePrecNextRoad);
            
                var pasRoad = 30000;
                if ( options.distNextRoad < 2000 ) {
                    pasRoad = 5000;
                }
                if ( options.distNextRoad < 1000 ) {
                    pasRoad = 1000;
                }
            
                if ( deltaTimeNextRoad > pasRoad ) {
                    getNextRoad();
                    timePrecNextRoad = time;
                }
            
                // verif toutes les 10 seconde si on est sur le trajet
                if ( (deltaTime > 10000 || timePrec == 0) && flag.trajetEnCours ) {
                         
                    // verif si le mobil est sur la ligne, par recup de la distance (en metre)
                    Nav.getDistance(options.src_x, options.src_y, function(distance) {
                                         
                        // si mobil > a 100 m ==> on est plus sur le trajet
                        if ( distance > 100 ) {
                                         
                            // demande de changement de route
                            searchRoad();
                        }	
                    });
                    timePrec = time;
                }
            }
        }
    });
    // DATAGPS - fin
              
    // Gestion des paramètres GPS
    // ---------------------------
    // recup des parametre du gps
    Nav.getParamGPS(function(param) {
                              
        // envoi des parametres a IHM
        socket.emit('PARAM', param);
                              
        // changement des parametre locaux
        changeParam(param);
    })
              
    // SETPARAM - reception modif de parametre
    socket.on('SETPARAM', function(paramSend) {
                        
        // modification des parametre en BDD
        Nav.setParamGPS(paramSend);
                        
        // changement des parametre locaux (options)
        var param = [paramSend];
        changeParam(param);
    })
              
    // envoi de la route en cours JSON a la connexion IHM
    // ---------------------------------------------------
    Nav.getJsonRoute( function(result) {
                               
        if ( result == 'NONE' ) {
            console.log(glb.Time() +' [GPS]\t pas de route en cours');
        } else {
                               
            // on recupere la destination suivante
            Nav.getNextDestination(function(dataEncours) {
                                                      
                options.trg_ville = dataEncours['ville'].trim();
                options.trg_postal = dataEncours['postal'].trim();
                options.trg_vertice = dataEncours['vertice'].trim();
                                                      
                // reprise du trajet en cours ?
                var question = {
                    phrase: 'Continuer la route vers ' + options.trg_ville + '(' + options.trg_postal + ') ?',
                    reponses: 'oui:non'
                }
                socket.emit('QUESTION', question);
                socket.on('REPROUTE', function(rep) {
                                                                
                    if ( rep == 'oui' ) {
                        console.log(glb.Time() +' [GPS]\t reprise route : '+options.trg_ville+' - '+options.trg_postal+' - '+options.trg_vertice);

                        //socket.emit('TRAJET', options);
                        socket.emit('ROADJSON', result);
                        flag.trajetEnCours = true;
                        getDataTrajet(false);
                                                                
                    } else {
                                                                
                        // arret de l'itineraire en cours
                        Nav.razRouteEnCours();
                        options.trg_ville = '';
                        options.trg_postal = '';
                        options.trg_vertice = '';
                        
                        getDataTrajet(false);
                        //socket.emit('TRAJET', options);
                    }
                })
                // REPROUTE - fin
            })
        }
    });
              
    // gestion des saisies de target
    // -----------------------------
    // recuperation des group POI
    Nav.getPOIgroup( function(result) {
        socket.emit('GRPPOI', result);
    })

    // SGRPPOI - recup du sous groupe
    socket.on('SGRPPOI', function(groupid) {
                        
        console.log(glb.Time() +' [GPS]\t recuperation POI group '+groupid);
                        
        Nav.getPOIsousgroup(groupid, function(result) {
            socket.emit('SOUSGRPPOI', result);
        })
    })
              
    // GETPOI - recuperation des POI
    socket.on('GETPOI', function(poi) {
                        
        var data = poi.split(':');
                        
        if ( data[0] == 'bygrp' ) {
                        
            console.log(glb.Time() +' [GPS]\t recuperation POI group '+data[1]);
                        
            Nav.getPOIsousgroup(data[1], function(result) {
                //envoi des sous group a IHM
                socket.emit('SOUSGRPPOI', result);
            })
                        
            Nav.getPOI(data[1], options.src_x, options.src_y, function(listpoi) {
                socket.emit('LSTPOI', listpoi);
            })
        }
    })
    // GETPOI - fin
    
    // GETHISTO - recuperation historique des trajets
    socket.on('GETHISTO', function() {
    
        Nav.getHisto( function(histo) {
        
            socket.emit('LSTHISTO', histo);
        
        })
    
    }) // GETHISTO - fin

    // GETVILLE - recherche des villes en fonctions des entree sur clavier
    socket.on('GETVILLE', function(charactere) {
        
        if ( config.GPS.debug ) {
            console.log(glb.Time() +' [GPS]\t GETVILLE reception caractere : '+charactere+' '+flag.searchVille);
        }
        
        // si recherche en cours on ne recherche pas d'autre
        if ( ! flag.searchVille ) {
        
            if ( config.GPS.verbose ) {
                console.log(glb.Time() +' [GPS]\t GETVILLE recherche pour caractere : '+charactere);
            }
        
            flag.searchVille = true;
            
            Nav.getVille(charactere, options.carte, function(result) {
                
                // si flag.nexrsearchVille n'est pas vide (recherche en attente), on relance une recherche, sinon on affiche.
                if ( flag.nextsearchVille != 'none' ) {
                
                    if ( config.GPS.verbose ) {
                        console.log(glb.Time() +' [GPS]\t GETVILLE recherche pour caractere next : '+flag.nextsearchVille);
                    }
                    
                    Nav.getVille(flag.nextsearchVille, options.carte, function(result) {
                        flag.nextsearchVille = 'none';
                        socket.emit('LSTVILLE', result);
                        flag.searchVille = false;
                    })
                } else {
                    socket.emit('LSTVILLE', result);
                    flag.searchVille = false;
                }
                
            });
        } else {
            flag.nextsearchVille = charactere;
            if ( config.GPS.debug ) {
                console.log(glb.Time() +' [GPS]\t GETVILLE prochain caractere : '+flag.nextsearchVille);
            }
        }
    });
              
    // GETROAD - recherche de la nouvelle route
    socket.on('GETROAD', function(itineraire) {
                        
        console.log(glb.Time() +' [GPS]\t reception nouvel itineraire : '+itineraire['name']+' '+itineraire['postal']+' '+itineraire['lat']+' '+itineraire['lon']);
                        
        var d = new Date();
        var startTime = d.getTime();
                        
        // positionnement des indicateurs de recherche en cours
        flag.trajetEnCours = false;
        socket.emit('WAIT', 'on');
        
        Nav.convertDMStoDEG(itineraire['lat'], itineraire['lon'], itineraire['postal'], function(latfinal, lonfinal) {
                        
            // recuperation du vertice + positionnement variable globales
            Nav.getVerticeID(lonfinal, latfinal, function(vertice) {
                                         
                options.trg_ville = itineraire['name'];
                options.trg_postal = itineraire['postal'];
                options.trg_vertice = vertice;
                options.trg_x = lonfinal;
                options.trg_y = latfinal;
            
                // archivage de historique
                Nav.histoIti(options);
            
                socket.emit('TRAJET', options);
            
                // mise a jour table itineraire
                Nav.setItineraire(options);
                                         
                if ( options.modeSearch == 'tempo' ) {
                                         
                    // calcul du polygone de recherche
                    Nav.createWaysPoly(options, function(coord) {
                                                            
                        socket.emit('POLYSEARCH', coord);
                                                            
                        var d = new Date();
                        var endTime = d.getTime();
                        var tpsEcoule = (parseFloat(endTime) - parseFloat(startTime))
                        var addZero = function(v) { return v<10 ? '0' + v : v; };
                        var e = new Date(tpsEcoule); // js fonctionne en milisecondes
                                                            
                        console.log(glb.Time() +' [GPS]\t temps de creation "tmpways" : '+tpsEcoule+' :'+addZero(e.getMinutes())+':'+e.getSeconds());
                                                            
                        searchRoad(socket);
                                                            
                    }) // createWaysPoly
                } else {
                    searchRoad(socket);
                }
            }) // getVertceID
        }) // convertDMStoDEG
    }); // GETROAD
              
    // GETFAV - recuperation des favoris
    socket.on('GETFAV', function() {
        Nav.getFavoris( function(result) {
            socket.emit('FAVORIS', result);
        })
    })
    
    function getDataTrajet(loop) {
    
        if ( loop != false )
            loop = true;
    
        console.log(glb.Time() +' [GPS]\t getDataTrajet - recup donnees START '+loop);
    
        // recuperation des data rue et km max du mobil et envoi a IHM
        Nav.getDataMobil(options.src_x, options.src_y, function(position) {
            socket.emit('MOBIL', position);
        })
    
        if ( flag.trajetEnCours ) {
        
            // recuperation temps et distance total du trajet
            if ( options.trg_disttot == '' || options.trg_tpstot == '' ) {
            
                Nav.getDataRouteencours( function(dataTRG) {
                                    
                    if ( dataTRG != 'NONE' ) {
                        options.trg_disttot = Math.round(dataTRG['distkm']);                                    
                        options.trg_tpstot = Nav.conversion_seconde_heure(dataTRG['tpsTot']);
                        options.trg_tpstotsec = dataTRG['tpsTot'];                          
                        socket.emit('TRAJET', options);
                    }
                })
            }
        
            // recuperation du vertice en cours
            Nav.getVerticeID(options.src_x, options.src_y, function(vertice) {
                         
                // recuperation de la seq + tps parcouru
                Nav.getSeqTimeVertice(vertice, function(tpsEcoule) {
                                                
                    if ( tpsEcoule != undefined ) {
                                               
                        // calcule du temps de parcours restant
                        var tmpEcoul = parseFloat(options.trg_tpstotsec) - parseFloat(tpsEcoule['agg_cost']);
                        options.tpsrestant = Nav.conversion_seconde_heure(tmpEcoul);
                                               
                        // calcul heure d arrivee
                        var d = new Date();
                        var nowTime = d.getTime(); // js fonctionne en milisecondes
                        var tmpArr = parseFloat(nowTime) + (parseFloat(tmpEcoul) * 1000);
                                               
                        var addZero = function(v) { return v<10 ? '0' + v : v; };            
                        var e = new Date(tmpArr); // js fonctionne en milisecondes
                        options.arrTime = addZero(e.getHours())+'h'+addZero(e.getMinutes());
                                               
                        // recuperation distance restante a parcourir
                        Nav.getDistRestRouteencours(tpsEcoule['seq'], function(distRest) {                        
                            options.distrestante = Math.round(distRest['distkm']);
                            socket.emit('TRAJET', options);
                            console.log(glb.Time() +' [GPS]\t getDataTrajet - recup donnees FIN '+loop);
                        })
                    }
                })
            })
        }
        if ( loop ) {
            setTimeout(getDataTrajet, 30000);
        }
    }
    getDataTrajet(true);
    
    // fonction recherche changement itineraire
    // ----------------------------------------
    function getNextRoad() {

        // recuperation du vertice en cours
        Nav.getVerticeID(options.src_x, options.src_y, function(vertice) {
                         
            // recuperation de la seq + tps parcouru
            Nav.getSeqTimeVertice(vertice, function(sequence) {
            
                if ( sequence != undefined ) {
                
                    Nav.getNextRoad(sequence['seq'], function(res) {
                
                        var routeRef = 'vide';
                        var routeName = 'vide';
                        var distance = 0;
                        var ptStartSrc = '';
                        var ptEndSrc = '';
                        var ptStartTrg = '';
                        var ptEndTrg = '';
                        //res.forEach( function(row) {
                        for ( var i = 0; i < res.length; i++) {
                        
                            //console.log('---> '+routeRef+' '+res[i]['seq']+' '+res[i]['ref']+' - '+res[i]['name']+' '+res[i]['length_m']);
                            
                            if ( routeRef == 'vide' ) {
                                routeRef = res[i]['ref'];
                            }
                            if ( routeName == 'vide' ) {
                                routeName = res[i]['name']
                            }
                        
                            if ( routeRef == res[i]['ref'] || ( res[i]['ref'] == null && ( res[i]['name'] == null || res[i]['name'].indexOf("Rond-Point") != -1 ))) {
                            
                                distance = parseFloat(res[i]['length_m']) + parseFloat(distance);
                                ptStartSrc = res[i]['ptstart'];
                                ptEndSrc =  res[i]['ptend'];
                                
                            } else {
                                
                                var nextRoute = res[i]['ref'];
                                if ( res[i]['name'] != null ) {
                                    nextRoute = nextRoute+' - '+res[i]['name'];
                                }
                                
                                ptStartTrg = res[i]['ptstart'];
                                ptEndTrg = res[i]['ptend'];
                                
                                //Math.acos((( (parseFloat(3)-parseFloat(2)) * (parseFloat(-1)-parseFloat(2)) ) + ((parseInt(1)-parseInt(-3))*(parseInt(4)-parseInt(-3))))/(Math.sqrt(((parseFloat(3)-parseFloat(2))*(parseFloat(3)-parseFloat(2)))+((parseInt(1)-parseInt(-3))*(parseInt(1)-parseInt(-3))))*Math.sqrt(((parseFloat(-1)-parseFloat(2))*(parseFloat(-1)-parseFloat(2)))+((parseInt(4)-parseInt(-3))*(parseInt(4)-parseInt(-3))))))/(Math.PI/180);
                                
                                // pour angle BAC
                                // Math.acos((( (parseFloat(Bx)-parseFloat(Ax)) * (parseFloat(Cx)-parseFloat(Ax)) ) + ((parseInt(By)-parseInt(Ay))*(parseInt(Cy)-parseInt(Ay))))/(Math.sqrt(((parseFloat(Bx)-parseFloat(Ax))*(parseFloat(Bx)-parseFloat(Ax)))+((parseInt(By)-parseInt(Ay))*(parseInt(By)-parseInt(Ay))))*Math.sqrt(((parseFloat(Cx)-parseFloat(Ax))*(parseFloat(Cx)-parseFloat(Ax)))+((parseInt(Cy)-parseInt(Ay))*(parseInt(Cy)-parseInt(Ay))))))/(Math.PI/180);
                                
                                // ABC : A(2, -3) B(3, 1) C(-1, 4)
                                
                                // recherche du POINT identique pour creer l angle entre les 2 vertisses
                                var ptA = '';
                                var ptB = '';
                                var ptC = '';
                                if ( ptStartSrc ==  ptStartTrg ) {
                                    ptB = ptEndSrc.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    ptA = ptStartSrc.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    ptC = ptEndTrg.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    if (config.GPS.verbose) {
                                        console.log(glb.Time()+' [GPS]\t getNextRoad - point egaux ptStartSrc ptStartTrg ');
                                    }
                                    
                                }
                                if ( ptStartSrc ==  ptEndTrg ) {
                                    ptB = ptEndSrc.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    ptA = ptStartSrc.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    ptC = ptStartTrg.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    if (config.GPS.verbose) {
                                        console.log(glb.Time()+' [GPS]\t getNextRoad - point egaux ptStartSrc ptEndTrg ');
                                    }
                                }
                                if ( ptEndSrc ==  ptStartTrg ) {
                                    ptB = ptStartSrc.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    ptA = ptEndSrc.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    ptC = ptEndTrg.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    if (config.GPS.verbose) {
                                        console.log(glb.Time()+' [GPS]\t getNextRoad - point egaux ptEndSrc ptStartTrg ');
                                    }
                                }
                                if ( ptEndSrc ==  ptEndTrg ) {
                                    ptB = ptStartSrc.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    ptA = ptEndSrc.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    ptC = ptStartTrg.replace(/POINT\(/, '').replace(/\)/, '').split(' ');
                                    if (config.GPS.verbose) {
                                        console.log(glb.Time()+' [GPS]\t getNextRoad - point egaux ptEndSrc ptEndTrg ');
                                    }
                                }
                                
                                // angle entre -180° et 180° par rapport à la position du mobil
                                if (config.GPS.verbose )
                                    console.log(glb.Time()+' [GPS]\t getNextRoad - ptB[0] : '+ptB[0]+', ptC[0] : '+ptC[0]);
                                var angleMultiplicateur = 1;
                                if ( parseFloat(ptB[0]) > parseFloat(ptC[0]) ) {
                                    angleMultiplicateur = -1;
                                }
                                
                                // calcul de l angle entre vertisse source et target
                                var angle = (Math.acos((( (parseFloat(ptB[0])-parseFloat(ptA[0])) * (parseFloat(ptC[0])-parseFloat(ptA[0])) ) + ((parseFloat(ptB[1])-parseFloat(ptA[1]))*(parseFloat(ptC[1])-parseFloat(ptA[1]))))/(Math.sqrt(((parseFloat(ptB[0])-parseFloat(ptA[0]))*(parseFloat(ptB[0])-parseFloat(ptA[0])))+((parseFloat(ptB[1])-parseFloat(ptA[1]))*(parseFloat(ptB[1])-parseFloat(ptA[1]))))*Math.sqrt(((parseFloat(ptC[0])-parseFloat(ptA[0]))*(parseFloat(ptC[0])-parseFloat(ptA[0])))+((parseFloat(ptC[1])-parseFloat(ptA[1]))*(parseFloat(ptC[1])-parseFloat(ptA[1]))))))/(Math.PI/180))*parseInt(angleMultiplicateur);
                                
                                if (config.GPS.debug) {
                                    console.log(glb.Time()+' [GPS]\t getNextRoad - ptB : '+ptB[0]+', '+ptB[1]);
                                    console.log(glb.Time()+' [GPS]\t getNextRoad - ptA : '+ptA[0]+', '+ptA[1]);
                                    console.log(glb.Time()+' [GPS]\t getNextRoad - ptC : '+ptC[0]+', '+ptC[1]);
                                    //console.log(glb.Time()+' [GPS]\t getNextRoad - calcul : Math.acos((( (parseFloat('+ptB[0]+')-parseFloat('+ptA[0]+')) * (parseFloat('+ptC[0]+')-parseFloat('+ptA[0]+')) ) + ((parseFloat('+ptB[1]+')-parseFloat('+ptA[1]+'))*(parseFloat('+ptC[1]+')-parseFloat('+ptA[1]+'))))/(Math.sqrt(((parseFloat('+ptB[0]+')-parseFloat('+ptA[0]+'))*(parseFloat('+ptB[0]+')-parseFloat('+ptA[0]+')))+((parseFloat('+ptB[1]+')-parseFloat('+ptA[1]+'))*(parseFloat('+ptB[1]+')-parseFloat('+ptA[1]+'))))*Math.sqrt(((parseFloat('+ptC[0]+')-parseFloat('+ptA[0]+'))*(parseFloat('+ptC[0]+')-parseFloat('+ptA[0]+')))+((parseFloat('+ptC[1]+')-parseFloat('+ptA[1]+'))*(parseFloat('+ptC[1]+')-parseFloat('+ptA[1]+'))))))/(Math.PI/180);');
                                    console.log(glb.Time()+' [GPS]\t getNextRoad - angle : '+angle);
                                }
            
                                options.distNextRoad = distance;
                                if ( parseInt(distance) > 2000 ) {
                                    distance = parseFloat(distance) / 1000;
                                    distance = Math.round(distance)+"km ";
                                } else {
                                    distance = Math.round(distance)+"m";
                                }
            
                                // positionnement image direction
                                var imageDirection = '';
                                if ( parseFloat(angle) > parseFloat(-10) && parseFloat(angle) < parseFloat(10) )
                                    imageDirection = "images/GPS_direction00.png";
                                if ( parseFloat(angle) > parseFloat(10) && parseFloat(angle) < parseFloat(60) )
                                    imageDirection = "images/GPS_direction45.png";
                                if ( parseFloat(angle) > parseFloat(60) && parseFloat(angle) < parseFloat(120) )
                                    imageDirection = "images/GPS_direction90.png";
                                if ( parseFloat(angle) > parseFloat(120) && parseFloat(angle) < parseFloat(180) )
                                    imageDirection = "images/GPS_direction135.png";
                                if ( parseFloat(angle) > parseFloat(-180) && parseFloat(angle) < parseFloat(-110) )
                                    imageDirection = "images/GPS_direction225.png";
                                if ( parseFloat(angle) > parseFloat(-110) && parseFloat(angle) < parseFloat(-70) )
                                    imageDirection = "images/GPS_direction270.png";
                                if ( parseFloat(angle) > parseFloat(-60) && parseFloat(angle) < parseFloat(-10) )
                                    imageDirection = "images/GPS_direction315.png";

                                var ret = {route: nextRoute, distance: distance, imageDirection: imageDirection };
                                
                                if ( config.GPS.verbose ) {
                                    console.log(glb.Time()+' [GPS]\t getNextRoad -'+ret['route']+', distance  : '+ret['distance']+' angle : '+angle+', imageDirection : '+imageDirection);
                                }
                                socket.emit('NEXTROAD', ret);
                                break;
                            }
                        }
                    })
                }
            })
        })
    }
    
    // fonction de recherche de route
    // ------------------------------
    function searchRoad() {
    
        console.log(glb.Time() +' [GPS]\t searchRoad() - changement de route');
        socket.emit('WAIT', 'on');
        flag.trajetEnCours = false;
        options.trg_disttot = '';
        options.trg_tpstot = '';
    
        var d = new Date();
        var startTime = d.getTime();
    
        // recuperation du vertice ID source
        Nav.getVerticeID(options.src_x, options.src_y, function(vertSourceID) {
                     
            options.src_vertice = vertSourceID;
                     
            var paramSearch = {
                vertSourceID: vertSourceID,
                vertTargetID: options.trg_vertice
            }
                     
            console.log(glb.Time() +' [GPS]\t searchRoad() - debut recherche de route, vertice src : '+options.src_vertice+', vertice trg : '+options.trg_vertice);
                     
            if ( options.modeSearch == 'tempo' ) {
                     
                // recherche de la route Nav.roadByDijkstraByTempo(paramSearch, function() {
                Nav.roadByDijkstraByTempo(options, function() {
                                           
                    console.log(glb.Time() +' [GPS]\t searchRoad() - fin recherche de route by Tempo');
                                           
                    // envoi resultat au client
                    Nav.getJsonRoute( function(result) {                                
                                                            
                        var d = new Date();
                        var endTime = d.getTime();                            
                        var tpsEcoule = (parseFloat(endTime) - parseFloat(startTime))                
                        var addZero = function(v) { return v<10 ? '0' + v : v; };
                        var e = new Date(tpsEcoule); // js fonctionne en milisecondes
                                                            
                        console.log(glb.Time() +' [GPS]\t searchRoad() - temps de recherche / affichage : '+tpsEcoule+' '
                                    +':'+addZero(e.getMinutes())
                                    +':'+e.getSeconds());
                                                            
                        socket.emit('ROADJSON', result);
                    });
                    socket.emit('WAIT', 'off');
                    flag.trajetEnCours = true; 
                    getDataTrajet(false);
                    getNextRoad();
                });
                     
            } else {
                     
                // recherche de la route Nav.roadByDijkstraByDirect(paramSearch, function() {
                Nav.roadByDijkstraByDirect(options, function() {
                                               
                    console.log(glb.Time() +' [GPS]\t searchRoad() - fin recherche de route By Direct');
                                               
                    // envoi resultat au client
                    Nav.getJsonRoute( function(result) {                                
                                                                
                        var d = new Date();
                        var endTime = d.getTime();                            
                        var tpsEcoule = (parseFloat(endTime) - parseFloat(startTime))                
                        var addZero = function(v) { return v<10 ? '0' + v : v; };
                        var e = new Date(tpsEcoule); // js fonctionne en milisecondes
                                                                
                        console.log(glb.Time() +' [GPS]\t searchRoad() - temps de recherche / affichage : '+tpsEcoule+' '
                                +':'+addZero(e.getMinutes())
                                +':'+e.getSeconds());
                                                                
                        socket.emit('ROADJSON', result);
                        socket.emit('WAIT', 'off');
                        flag.trajetEnCours = true;
                        getDataTrajet(false);                                
                    });
                });
            }
        })
    }
    // SEARCHROAD - fin
    
    // recuperation infos du morceau joue
    function getMediaInfo() {
        Media.RecupPLEnCours( function(PLenCours) {
    
            //recuperation du morceau à jouer et ses infos
            Media.RecupInfoTitre(PLenCours['PL'], PLenCours['piste'], function(Titre) {
    
                if (config.GPS.debug) {
                    console.log(glb.Time() + ' [NAVIGO]\t titre à jouer : '+Titre['id']+', '+Titre['nomartist']+', '+Titre['nomalbum']+', '+Titre['date']+', '+Titre['nomtitre']+', '+Titre['duree']+', '+Titre['path']+', '+Titre['coverpath']);
                }

                // envoi des infos tire au client
                socket.emit('TITRE', Titre);
                setTimeout(getMediaInfo, 5000);
            });
        });
    };
    getMediaInfo();
    // fin getMediaInfo

});
//IO SOCKET - fin



// fonction prise en compte du changement de parametre
// ---------------------------------------------------
function changeParam(param) {
    
    if (config.GPS.verbose) {
        console.log(glb.Time() +' [NAVIGO]\t changeParam - changement des parametres');
    }
    
    param.forEach( function(row) {
                  
        if ( row['parametre'] == 'carte' ) {
            if (config.GPS.verbose) {
                console.log(glb.Time() +' [NAVIGO]\t changeParam - carte selectionnee : '+row['valeur'] );
            }
            
            // creation du lien tile sur le pays selectionne
            fs.unlink('/home/pi/media/cartes/tiles', function() {
                fs.symlink('/home/pi/media/cartes/tiles.'+row['valeur'], '/home/pi/media/cartes/tiles', function(){
                    console.log(glb.Time() +' [NAVIGO]\t changeParam - create carte link : '+row['valeur'] );
                });
            });
            
            options.carte = row['valeur'];
        }
                  
        if ( row['parametre'] == 'mode recherche' ) {
            if (config.GPS.verbose) {
                console.log(glb.Time() +' [NAVIGO]\t changeParam - mode search selectionnee : '+row['valeur'] );
            }
            options.modeSearch = row['valeur'];
        }
                  
        if ( row['parametre'] == 'avec peage' ) {
            if (config.GPS.verbose) {
                console.log(glb.Time() +' [NAVIGO]\t changeParam - peage : '+row['type']+' - prev : '+options.peage );
            }
            if ( options.peage == '' ) {
                options.peage = row['valeur'];
            } else if ( options.peage == 'on' ) {
                options.peage = 'off';
            } else {
                options.peage = 'on';
            }
        }
    })
}
// CHANGEPARAM - fin
