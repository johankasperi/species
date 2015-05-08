var io = require('socket.io-client');
var mraa = require('mraa');
var socket = io('http://species.kspri.se');
var _ = require('underscore');

var digPins = [];
setupPins([9, 10, 11]); // Edit this line to decide which pins to use

var timeout = null;
var connectedClients = [];

// Connect to server
socket.on('connect', function() {
	socket.emit('board-connection', {});
});

socket.on('specie-isTouched', function(data) {
	if(data.bool == true) {
		startMakingSound(data.value, data.client);
	}
	else {
		stopMakingSound(data.value, data.client);
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
	var client = _.findWhere(connectedClients, { id: clientId });
	if(client) {
		client.timing = value;
	}
	else {
		connectedClients.push({
			id: clientId,
			timing: value
		})
	}
	if(!timeout) {
		blink(1);
	}
}

function stopMakingSound(value) {
	connectedClients = _.reject(connectedClients, function(c) { return c.id === clientId });
	if(connectedClients.length < 1) {
		clearTimeout(timeout);
		timeout = null;
		writePin(0);
	}
}

function startMakingSoundOtherSpecie(value) {
}

function stopMakingSoundOtherSpecie(value) {
}

function blink(bool) {
	writePin(bool ? 1 : 0);
	timeout = setTimeout(function() {
		bool = !bool;
		blink(bool);
	}, getTiming());
}

function getTiming() {
	var min = _.min(connectedClients, function(c) { return c.timing });
	min = min.timing;
	if(connectedClients.length == 1) {
		return min;
	}
	var sum = 0;
	for(var i = 0; i<connectedClients.length; i++) {
		sum += connectedClients[i].timing;
	}
	return min - (sum/min);
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