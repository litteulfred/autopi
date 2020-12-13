// function affichage des DIV menu
function AffDIV(div1, div2) {	

	document.getElementById(div1).style.display = "none";
	document.getElementById(div2).style.display = "initial";
	
}

// fonction des boutons RAZ dans MEDIA
function RazMedia() {
	AffDIV('divOther', 'divMusic');
	document.getElementById("lstMusic").innerHTML =  "";
	document.getElementById("WaitID").style.display = "inline";
	//socket.emit('CMDCLIENT', 'RAZMEDIA');
	sockMaster.emit('CMDCLIENT', 'RAZMEDIA');
}
function RazCover() {
	document.getElementById("LstMediaAudio").innerHTML =  "";
	document.getElementById("WaitID").style.display = "inline";
	socket.emit('CMDCLIENT', 'RAZCOVER');
}
function RazPhotos() {
//	AffDIV('divOther', 'divMusic');
//	document.getElementById("lstMusic").innerHTML =  "";
	document.getElementById("WaitID").style.display = "inline";
	socket.emit('CMDCLIENT', 'RAZPHOTO');
}

// mise au format du time pour le player
function formatTime(time) {
	var hours = Math.floor(time / 3600);
	var mins  = Math.floor((time % 3600) / 60);
	var secs  = Math.floor(time % 60);

	if (secs < 10) {
		secs = "0" + secs;
	}

	if (hours) {
		if (mins < 10) {
			mins = "0" + mins;
		}

			return hours + ":" + mins + ":" + secs; // hh:mm:ss
		
	} else {
        
		return mins + ":" + secs; // mm:ss
	}
}

// fonction mise a jour barre progression
function update(duration, time) {

	var fraction = time / duration;
	var percent  = Math.ceil(fraction * 100);

	if ( duration == "0" ) {
		percent = 0;
	}

//	var progress = document.querySelector('#progressBar');
//	progress.style.width = percent + '%';

	var progress = document.querySelector('#progressBarPlay');
	progress.style.width = percent + '%';


	document.querySelector('#progressTime').textContent = formatTime(time)+" / "+formatTime(duration);	

}

// play / pause sur le player 
function play() {

	var Img = document.getElementById("butPlayPause").src;
	var Cmd = {cmd:'' }

	if ( Img.indexOf('images/play.png') != -1 ) {
		document.getElementById("butPlayPause").src = 'images/pause.png';
		Cmd = {cmd:'play' }
	} else {
		document.getElementById("butPlayPause").src = 'images/play.png';
		Cmd = {cmd:'pause' }
	}
	socket.emit('CMDPLAYER', Cmd);
}

function Commande(sens, param) {
	
	var ToSend = {
		cmd: sens,
		param: param
	}
	socket.emit('CMDPLAYER', ToSend);
}

// selection des media
function SelectMedia(DivId) {
	
	var BackColorActuel = document.getElementById(DivId).style.backgroundColor;
	
	if ( BackColorActuel == "blue" ) {
		document.getElementById(DivId).style.backgroundColor = "";
	} else {
		document.getElementById(DivId).style.backgroundColor = "blue";
	}
}

// selection boutton
function SelectButt (Button) {

	var ButtonActuel = document.getElementById(Button).src;	
	if ( ButtonActuel.indexOf("images/random.png" ) != -1 ) {
		document.getElementById(Button).src = "images/randomSel.png";
	} else {
		document.getElementById(Button).src = "images/random.png";
	}

}

// function jouer la selection
function PlaySelected() {
		
	// recherche des div mediaxx
	var LstTD = document.getElementsByTagName("div");
	var Result = "NONE";
	
	// verifie si Random est coché
	var ButtonRand = document.getElementById('imgMenuBut4').src
	if (  ButtonRand.indexOf("images/randomSel.png") != -1 ) {
		Result = "RAND";
	}
	
	
	for (var i = 0, c = LstTD.length; i < c; i++) {
	
		if ( ! LstTD[i]['id'].indexOf('media') ) {
			
			var NumIDAlbum = LstTD[i]['id'].replace("media", "");
			
			// recherche si selectionne
			var Color = document.getElementById(LstTD[i]['id']).style.backgroundColor;
			if (Color) {
				Result = Result + ":" + NumIDAlbum;
			}
		}
	}
		console.log(Result);
	if ( Result != "NONE" ) {
		socket.emit('PLAYSELECTED', Result);
	}
}

// function jouer la video
function PlayVideo(mediaID) {
	
		document.getElementById("backgrndVDO").style.display = 'initial';
		socket.emit('PLAYVIDEO', mediaID);
	
}

// function activation bluetooth
function PlayBluetooth(macid) {
    
        //console.log(document.getElementById("conBluetooth"+macid).checked+"------");
    
        if ( document.getElementById("conBluetooth"+macid).checked == true ) {
            
            var cmd = "start_"+macid;
            socket.emit('PLAYBLUETOOTH', cmd);
        
            document.getElementById("ArtistPlay").innerHTML = 'bluetooth';
            document.getElementById("saverArtist").innerHTML = 'bluetooth';
            document.getElementById("TitrePlay").innerHTML = 'BLUETOOTH';
            document.getElementById("saverTitre").innerHTML = 'BLUETOOTH';
            
            document.getElementById("imgCover").src = 'images/defaultcoverbluetooth.png';
            document.getElementById("saverCover").src = 'images/defaultcoverbluetooth.png';
            document.getElementById("imgCover").style.boxShadow = '';
        
            update('0', '0');
        
        } else {
        
            var cmd = "stop_"+macid;
            socket.emit('PLAYBLUETOOTH', cmd);
            
            document.getElementById("conBluetooth"+macid).checked = false;
        
        }
    
}

// lancer jeux
function playJeux(jeuxID) {

	// on verifie si on active le son ou pas
	var son = true;
	var Img = document.getElementById("butPlayPause").src;
	if ( Img.indexOf('images/pause.png') != -1 ) {
		son = false;
	}
	document.getElementById("backgrndJEUX").style.display = 'initial';
	socket.emit('PLAYJEUX', { ID: jeuxID, son: son });
}

// scrollbar boutton UP
function moveUp(div) {
	document.getElementById(div).scrollTop-=350;
}
// scrollbar boutton Down
function moveDown(div) {
	document.getElementById(div).scrollTop+=350;
}

// changement etat wifi
function actionWifi() {
	var etatWifi = document.getElementById("imgWifi").src;
	if ( etatWifi.indexOf("images/wifi-" ) != -1 ) {
		sockSys.emit('WIFI', 'OFF');
	} else {
		sockSys.emit('WIFI', 'ON');
	}
}

function swapDiv(div) {
	
	if ( div == 'divPlEnCours' ) {
		$(divEtatSystem).hide('slow');
		$(divPlEnCours).show('slow');
		nextDiv = 'etatSystem';
	} else {
		$(divPlEnCours).hide('slow');
		$(divEtatSystem).show('slow');
		nextDiv = 'divPlEnCours';
	}
	setTimeout('swapDiv("'+nextDiv+'");','20000');
}

// changement de l'equalizer
function chgtEqual(equal) {
	console.log(equal);
	
	Cmd = {
		cmd: 'equal',
		param: equal
	}
	socket.emit('CMDPLAYER', Cmd);
}

function razTimeVDO (file) {
    var Cmd = {
        cmd:'razRepriseVDO',
        param: file
    }
    socket.emit('CMDPLAYER', Cmd);
}

