// insertion des librairies
var    _ = require('lodash'),
    fs = require('fs'),
    child_process = require('child_process'),
    glb = require('globalAutoradio'),
    ini = require('ini');

// mis en place des modes options globales
var defaults = {
    verbose: true,
    debug: false,
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
    console.log(glb.Time() +' [BLUETOOTH]\t Activation du serveur SOCKET');
} 
var io = require('socket.io').listen('8127');
io.sockets.on('connection', function (socket) {

    function parseTrameHexa(trameHexa) {
        
        if ( trameHexa.indexOf('6a00') != -1 ) {
            
            var champTitre = trameHexa.split('6a00');
            
            //console.log(trameHexa+" = "+champTitre[1]);
            
            // recuperation du titre
            var i = 0;
            var titre = '';
            while (i < champTitre[1].length ) {
                var j = parseInt(i) + parseInt(2);
                var octetHexa = champTitre[1].slice(i, j);
                var octetDec = parseInt(octetHexa, 16);
                //console.log(j+" - "+octetHexa);
                titre = titre+String.fromCharCode(octetDec);
                i = j;
            }
                        
            // recuperation artiste
            var i = 0;
            var artiste = '';
            while (i < champTitre[2].length ) {
                var j = parseInt(i) + parseInt(2);
                var octetHexa = champTitre[2].slice(i, j);
                var octetDec = parseInt(octetHexa, 16);
                //console.log(j+" - "+octetHexa);
                artiste = artiste+String.fromCharCode(octetDec);
                i = j;
            }
            
            // recuperation album
            var i = 0;
            var album = '';
            while (i < champTitre[3].length ) {
                var j = parseInt(i) + parseInt(2);
                var octetHexa = champTitre[3].slice(i, j);
                var octetDec = parseInt(octetHexa, 16);
                //console.log(j+" - "+octetHexa);
                album = album+String.fromCharCode(octetDec);
                i = j;
            }
            
            var envoi = {
                    titre: titre,
                    artiste: artiste,
                    album: album
              }
            socket.emit('TITREBLUE', envoi);
            console.log(envoi);
        }
    }

    var cmd = "system/tcpdump.sh";
    var tcpdump = child_process.spawn(cmd);
    tcpdump.stdout.on('data', function (data) {
        
            var dataString = data.toString();
            var tabtmp = dataString.split('\t');
            var affichage = false;
            var trameHexa = '';
            tabtmp.forEach( function(lig) {
                
                var champ = lig.split(' ');
                
                // fin de la trame precedent
                if ( champ[0] == '0x0000:') {
                    affichage = false;
                    if ( trameHexa != '' ) {
                        parseTrameHexa(trameHexa);
                    }
                    trameHexa = '';
                }
                
                // debut trame
                if ( champ[0] == '0x0000:' && champ[2] == '020c' && champ[3] != "205f" ) {
                    affichage = true;
                }
                
                if (affichage) {
                    trameHexa = trameHexa+champ[2]+champ[3]+champ[4]+champ[5]+champ[6]+champ[7]+champ[8]+champ[9];
                }
            })
    });
    tcpdump.stderr.on('data', function (data) {
        console.log(glb.Time() +' TCPDUMP stderr: ' + data);
    });
    tcpdump.on('close', function(close) {
        console.log(glb.Time() +' TCPDUMP close');
    });
    tcpdump.on('exit', function(close) {
        console.log(glb.Time() +' TCPDUMP exit');   
    });
})
