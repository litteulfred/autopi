function createMapTile() {
	
	var mapRet = new ol.Map({
		target: 'map',
		layers: [
			new ol.layer.Tile({
				source: new ol.source.XYZ({
					url: "./tiles/{z}/{x}/{y}.png",
					maxZoom: 15,
				})
			})
		],
		view: new ol.View({
			center: ol.proj.transform([xPosit, yPosit], 'EPSG:4326', 'EPSG:3857'),
			zoom: 14
		}),
		controls:[
			new ol.control.ScaleLine({geodesic: true, target: document.getElementById('echelle')}), // affichage echelle
			new ol.control.Zoom(), //affichage boutons zoom
			new ol.control.Rotate()
		]
	});
	return mapRet;
}

function createMapWeb() {

	var mapRet = new ol.Map({
		target: 'map',
		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM()
			})
		],
			view: new ol.View({
			center: ol.proj.transform([xPosit, yPosit], 'EPSG:4326', 'EPSG:3857'),
			zoom: 14
		}),			
		controls:[
			new ol.control.ScaleLine({geodesic: true, target: document.getElementById('echelle')}), // affichage echelle
			new ol.control.Zoom(), //affichage boutons zoom
			new ol.control.Rotate()
		]
	});
	return mapRet;
}

// positionnement de la recherche, mise en forme de la page HTML
function searchBy(what) {

	var el_divKeyboard = document.getElementById('divKeyboard');
	var el_lstValues = document.getElementById('lstValues');
	var el_divParam = document.getElementById('divParam');
	var el_divPoi = document.getElementById('divPoi');
	var el_lstGrpPoi = document.getElementById('lstGrpPoi');
	var el_lstSousGrp = document.getElementById('lstSousGrp');
	var el_titreSelec = document.getElementById('titreSelec');
	var el_lstParamSwitch = document.getElementById('lstParamSwitch');

	// re-initialisation des parametres
	el_lstValues.innerHTML = '';
	el_titreSelec.innerHTML = '';
	el_divKeyboard.style.display = 'none';
	el_lstValues.style.display = 'initial';
	el_divParam.style.display = 'none';
	el_divPoi.style.display = 'none';
	el_lstGrpPoi.style.display = 'none';
	el_lstSousGrp.style.display = 'none';
	el_lstParamSwitch.style.display = 'none';

	if ( what == 'ville' ) {
		el_divKeyboard.style.display = 'initial';
		el_titreSelec.innerHTML = "VILLE";
	}
	
	if ( what == 'poi' ) {
		el_divPoi.style.display = 'initial';
		el_lstGrpPoi.style.display = 'initial';
		el_titreSelec.innerHTML = "FAVORIS / POI";
	}
 
    if ( what == 'histo' ) {
        el_divPoi.style.display = 'initial';
        el_lstGrpPoi.style.display = 'initial';
        el_titreSelec.innerHTML = "HISTORIQUE DES RECHERCHES";
    }
	
	if ( what == 'xy' ) {
		el_divKeyboard.style.display = 'initial';
		el_titreSelec.innerHTML = "COORDONNEES (ex : 47°7'18\"N 1°45'3\"E)";
	}
	
	if ( what == 'param' ) {
		el_divParam.style.display = 'initial';
		el_lstParamSwitch.style.display = 'initial';
		el_lstValues.style.display = 'none';
		el_titreSelec.innerHTML = "REGLAGES";
	}
}

// envoi de la demande nouvelle destination
function searchDestination() {

	document.getElementById('divControl').style.display = 'none';

	console.log(' searchDestination : '+itineraire[0])

	sockNavig.emit('GETROAD', itineraire);

}

// envoi de la recherche de route
function searchRoad(name, postal, lat, lon) {
    
    document.getElementById('divControl').style.display = 'none';
    
    // vérification du bon format pour DMS
    if ( postal == 'dms' ) {
    
        console.log('searchroad dms : '+lat+' '+lon)
        var coordLat = lat.split(':');
        var coordLon = lon.split(':');
        
        if ( coordLat.length != 4 || coordLon.length != 4 ) {
            console.log('searchroad dms mauvais format ');
            return;
        }
    }
    
    var itineraire = {
        name: name,
        postal: postal,
        lat: lat,
        lon: lon
    } 
    
    console.log('searchroad : '+itineraire['name']+' '+itineraire['postal']+' '+itineraire['lat']+' '+itineraire['lon']);
    sockNavig.emit('GETROAD', itineraire);
    
}

// insertion point ou ville sur itineraire
function majIti(itineraire) {

	console.log(itineraire);

	var lstVilleIti = '';
	itineraire.forEach( function(ville, index) {
		
		lstVilleIti = lstVilleIti
				+ "<div class='lstIti' onclick='itineraire.splice("+index+",1);majIti(itineraire);' >"
				+ index + ' - '+ ville['nom'] + ' (' + ville['postal'] + ') </div>';
	})
	document.getElementById("itiRoad").innerHTML = lstVilleIti;
}
// ajout de l iteneraire dans le tableau 'itineraire'
function addVilleIti(nom,postal,lat,lon) {
	
	// vérification du bon format pour DMS
	if ( postal == 'dms' ) {
	
		console.log('addVilleIti dms : '+lat+' '+lon)
		var coordLat = lat.split(':');
		var coordLon = lon.split(':');
		
		if ( coordLat.length != 4 || coordLon.length != 4 ) {
			console.log('addVilleIti dms mauvais format ');
			return;
		}
	}
		
	var ville = {
		nom: nom,
		postal: postal,
		lat: lat,
		lon: lon
	}
	itineraire.push(ville);
	console.log(' addVilleIti : '+itineraire[0]['nom']+', '+itineraire[0]['lat']+', '+itineraire[0]['lon'])
	majIti(itineraire);
}
		
// recherche dynamique de villes ou envoi coordonee GPS
function getVille() {
		
	var charactere = document.getElementById("write").innerHTML;
	
	if ( typeSearch == 'ville' ) {
		sockNavig.emit('GETVILLE', charactere.toLowerCase() );
	}
		
	if ( typeSearch == 'xy' ) {
				
		if ( /[0-9]/.test(charactere[0]) || charactere[0] == '-' ) {

			charactere = charactere.replace(/°|\'|\"/g, ':');
			var coord = charactere.split(' ');

			var tmpCoord = '<div style="height: 30px;"' 
					+' onclick=\'searchRoad(\"'+charactere+'\",'
					+'\"dms\",'+'\"'+coord[0]+'\",'+'\"'+coord[1]+'\");\' >'+charactere+'</div>';
			document.getElementById("lstValues").innerHTML = tmpCoord;
		}
			
	}		
}

// affichage DIV de "control" / selection destination
function selecDestination() {
			
	document.getElementById('divControl').style.display = 'initial';
	document.getElementById('lstValues').innerHTML ='';
	document.getElementById('write').innerHTML ='';
	villeTRG = '';

}

// passage en mod itineraire
function selButtIti() {
		
	var etat = document.getElementById("buttIti").innerHTML;
			
	if ( etat == '' ) {
			
		document.getElementById("buttIti").innerHTML = 'ITI';
		document.getElementById("lstValues").style.height = '370px';
		document.getElementById("lstValues").style.top = '210px';
		document.getElementById("itiRoad").style.display = 'initial';
			
	} else {
			
		document.getElementById("buttIti").innerHTML = '';
		document.getElementById("lstValues").style.height = '580px';
		document.getElementById("lstValues").style.top = '10px';
		document.getElementById("itiRoad").style.display = 'none';
			
	}
		
}

// arreter / reprendre le suivi
function suiviONOFF() {

	if ( document.getElementById("imgSuivre").src == 'http://'+hostAutoradio+':8120/html/images/GPS_suivre.png' ) {
		
		console.log('suiviONOFF - desactivation');
		document.getElementById("imgSuivre").src = 'http://'+hostAutoradio+':8120/html/images/GPS_suivreNO.png'
		suivi = 'OFF';
	
	} else {
	
		console.log('suiviONOFF - activation');		
		document.getElementById("imgSuivre").src = 'http://'+hostAutoradio+':8120/html/images/GPS_suivre.png'
		suivi = 'ON';
	}
}

// bascule des bouttons de suivi
function switchSwitch() {

}
