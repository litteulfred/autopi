var http = require('http'),
//	_ = require('lodash'),
	path = require('path'),
	fs = require('fs'),
	ini = require('ini');
	glb = require('globalAutoradio');

/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8');
 
//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);

/* ----------------------------------------------------- */
/* serveur HTTP                                          */
/* ----------------------------------------------------- */
if (config.http.verbose) {
	console.log(glb.Time() +' [HTTP]\t Activation du serveur HTTP');
}

console.log('STARTINGHTTP');
var server = http.createServer(function (req, res) {

	// recuperation de la page à afficher
	var Page = path.basename(req.url);
	var Content = "";
	var rootPath = __dirname.replace('common', '');

	if (config.http.debug) {
		console.log(glb.Time() + ' [HTTP]\t HTTP - '+req.url+' - '+Page+' - '+rootPath);
	}
	
	var TmpPath = rootPath + req.url;
	
	var Path = glb.Convert(TmpPath);

	if (config.http.verbose) {
		console.log(glb.Time() + ' [HTTP]\t HTTP - ouverture ' + Path);
	}
	fs.exists(Path, function(exists) { 
  		
  		if (exists) {
			
			fs.readFile(Path, function (err, data) {
				if (err) console.log(err);
				res.writeHead(200, {'Content-Type': Content});
				res.write(data);
				res.end();
			})
		
		} else {
			
			if (config.http.verbose) {
				console.log(glb.Time() + ' [HTTP]\t HTTP - INEXSISTANT ' + Path);
			}
			
		}
	});

}).listen(8120);

var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {

	if (config.http.verbose) {
		console.log(glb.Time() +' [HTTP]\t conection socket serveur HTTP');
	}

	socket.on('END', function() {
		if (config.http.verbose) {
			console.log(glb.Time() +' [HTTP]\t Arret du serveur HTTP');
		}
		process.exit();
	});
});