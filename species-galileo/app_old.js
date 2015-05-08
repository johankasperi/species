var io = require('socket.io-client');
var mraa = require('mraa');
var socket = io('http://species.kspri.se');

var digPins = [];
setupPins([9, 10, 11]); // Edit this line to decide which pins to use

var timeout = null;
var timing = 0;
//var timingOther = 0;

// Connect to server
socket.on('connect', function() {
	socket.emit('board-connection', {});
});

socket.on('specie-isTouched', function(data) {
	if(data.bool == true) {
		startMakingSound(data.value);
	}
	else {
		stopMakingSound(data.value);
	}
})

socket.on('otherSpecie-isTouched', function(data) {
	if(data.bool == true) {
		startMakingSoundOtherSpecie(data.value);
	}
	else {
		stopMakingSoundOtherSpecie(data.value);
	}
})

function startMakingSound(value) {
	console.log("Start making sound!")
	if(!timeout) {
		timing = value;
		blink(1);
	}
	else {
		timing = value;
	}
}

function stopMakingSound(value) {
	console.log("Stop making sound!");
	clearTimeout(timeout);
	timeout = null;
	timing = 0;
	writePin(0);
}

function startMakingSoundOtherSpecie(value) {
	setTimeout(function() {
		writePin(0);
	}, 500)
	console.log("Start making sound! (other specie)")
}

function stopMakingSoundOtherSpecie(value) {
	console.log("Stop making sound! (other specie)");
}

function blink(bool) {
	writePin(bool ? 1 : 0);
	timeout = setTimeout(function() {
		bool = !bool;
		blink(bool);
	}, timing);
}

function setupPins(pins) {
	for(var i = 0; i<pins.length; i++) {
		var pin = new mraa.Gpio(pins[i]);
		pin.dir(mraa.DIR_OUT);
		pin.write(0);
		digPins.push(pin);
	}
}

function writePin(bool) {
	for(var i = 0; i<digPins.length; i++) {
		digPins[i].write(bool);
	}
}