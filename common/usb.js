// insertion des librairies
var _ = require('lodash'),
	glb = require('globalAutoradio'),
	socketCL = require('socket.io-client')('http://127.0.0.1:8121');
	serialport = require('serialport');
	
// mis en place des modes options globales
var defaults = {
    verbose: true,
    debug: false,
    usb: '/dev/ttyUSB0',
};
options = _.defaults(defaults);

SerialPort = serialport.SerialPort; // make local instance

// ouverture du port
var usbPort = new SerialPort(options.usb, {
	baudRate: 9600,
	parser: serialport.parsers.readline("\n"), // position le fin de ligne
});

usbPort.on('open', function(){

	if (options.verbose) {
		console.log(glb.Time() +' [USB]\t ouverture du port USB '+options.usb);
	}
	
	usbPort.write("CONNECT");
	
});

var d = new Date();
	var tempo = d.getTime();
usbPort.on('data', function(data){

	var ResData = data.split(':');
	if (options.verbose && ResData['0'] != "TEST" ) {
		console.log(glb.Time() +' [USB]\t reception du message '+data);
	}
	
	if ( ResData['0'] == "HALT" ) {
	
		// shutdown du systeme
		socketCL.emit('END');
	}
	if ( ResData['0'] == "VOL" ) {
	
		var d1 = new Date();
		var t = d1.getTime();
		var delta = parseFloat(t) - parseFloat(tempo);
		
		if ( delta > 2000 ) {
		
			console.log(glb.Time() + " [MASTER]\t reception bouton PAUSE");

			socketCL.emit('BUTTVOL');
			var d = new Date();
			tempo = d.getTime();
		
		}
	}

});

usbPort.on('close', function(){

	if (options.verbose) {
		console.log(glb.Time() +' [USB]\t fermeture du port USB '+options.usb);
	}

});
usbPort.on('error', function(){

	if (options.verbose) {
		console.log(glb.Time() +' [USB]\t ERROR du port USB '+options.usb);
	}

});
