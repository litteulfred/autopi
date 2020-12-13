

// function de selection entre plusieurs DIV
//         divON : la div à selectionner
//         divOFF : les div a eteindre div1:div2:xxx
function selectButtSwitch(buttON, buttOFF) {
	
	document.getElementById(buttON).src = 'images/caseON.png';
	
	var tab = buttOFF.split(':');	
	tab.forEach( function(button) {
		document.getElementById(button).src = 'images/caseOFF.png';
	});
	
}

// recherche de la div selectionnee
function whichButtSelect(caseLst) {

	var tab = caseLst.split(':');
	var selButt = "";
	tab.forEach( function(button) {

		img = document.getElementById(button).src;
		
		if ( img.indexOf('images/caseON.png') != -1  ) {
			selButt = button;
		}		
	});
	return selButt;
}

// scrollbar boutton UP
function moveUp(div, pas) {
	console.log('move up '+div+' '+pas);
	document.getElementById(div).scrollTop+=parseInt(pas);
}
// scrollbar boutton Down
function moveDown(div, pas) {
	console.log('move down '+div+' '+pas);
	document.getElementById(div).scrollTop-=parseInt(pas);
}

function moveCursorPOI(sens) {
	
	// recuperation de l'emplacement du cursor
	var positActuel = document.getElementById('cursor').offsetLeft;
	var positMax = parseInt(document.getElementById('cursorLine').offsetWidth) - parseInt(document.getElementById('cursor').offsetWidth) ;
	
	// calcul du nombre de page
	var nbrTotalPOI = document.getElementById('nbrPOI').innerHTML;
	var nbrPage = Math.ceil(parseInt(nbrTotalPOI) / parseInt(8));
	
	// calcul du pas
	var pas = parseFloat(positMax) / parseFloat(nbrPage);
	
	// deplacement cursor
	if ( positActuel < positMax && sens == 'up' ) {
		var newPosit = Math.ceil(parseInt(positActuel) + parseFloat(pas));
		document.getElementById('cursor').style.left = newPosit+'px';
		//console.log('posit actuel : '+positActuel+', next : '+newPosit+' nombre de page : '+nbrPage+' pas : '+pas);
	}
	if ( positActuel > 0 && sens == 'down' ) {
		var newPosit = Math.ceil(parseInt(positActuel) - parseFloat(pas));
		document.getElementById('cursor').style.left = newPosit+'px';
		//console.log('posit actuel : '+positActuel+', next : '+newPosit+' nombre de page : '+nbrPage+' pas : '+pas);
	}
}

// fonction de selection / deselection de DIV
function selectDiv(div) {

	var selecOpac = '1';
	var unSelecOpac = '0.2';
	
	// recuperation de la valeur initial
	var selec = document.getElementById(div).style.opacity;
	
	//console.log('opac '+div+' : '+selec);
	
	if ( selec == selecOpac || selec == '' ) {
		document.getElementById(div).style.opacity = unSelecOpac;
	}
	if ( selec == unSelecOpac ) {
		document.getElementById(div).style.opacity = selecOpac;
	}
}

// function bouton ON / OFF
function switchOnOff(buttonID) {

	var etat = document.getElementById(buttonID).src;
	if ( etat.indexOf("images/switch_on.png") != -1 ) {
		document.getElementById(buttonID).src = "images/switch_off.png";
	} else {
		document.getElementById(buttonID).src = "images/switch_on.png"
	}

}

// fonction date heure barre
function dateAuto(id) {
        date = new Date;
        annee = date.getFullYear();
        moi = date.getMonth();
        mois = new Array('Janv', 'F&eacute;vr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Ao&ucirc;t', 'Sept', 'Oct', 'Nov', 'D&eacute;c');
        j = date.getDate();
        jour = date.getDay();
        jours = new Array('Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi');
        document.getElementById('Jour').innerHTML = jours[jour];
        resulD = j+' '+mois[moi]+' '+annee;
        document.getElementById('Date').innerHTML = resulD;
        setTimeout('dateAuto("'+id+'");','1000');
        return true;
}
function heureAuto(id) {
        date = new Date;
        h = date.getHours();
        if(h<10)
        {
                h = "0"+h;
        }
        m = date.getMinutes();
        if(m<10)
        {
                m = "0"+m;
        }
        s = date.getSeconds();
        if(s<10)
        {
                s = "0"+s;
        }
  //      resulH = h+':'+m+':'+s;
  //      document.getElementById(id).innerHTML = resulH;
        document.getElementById("Heure").innerHTML = h;
        document.getElementById("Minute").innerHTML = m;
        document.getElementById("Seconde").innerHTML = s;
        setTimeout('heureAuto("'+id+'");','1000');
        return true;
}