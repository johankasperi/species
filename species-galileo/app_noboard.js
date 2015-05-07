var io = require('socket.io-client');
var socket = io('http://species.kspri.se');

var timeout = null;
var timing = 0;
var timingOther = 0;

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
		timeout = "fake timeout";
		timing = value;
	}
	else {
		timing = value;
	}
	console.log("Timing: "+timing);
}

function stopMakingSound(value) {
	console.log("Stop making sound!");
	timeout = null;
	timing = 0;
}

function startMakingSoundOtherSpecie(value) {
	console.log("Start making sound! (other specie)")
	value *= 0.2;
	timingOther = value;
	if(!timeout) {
		timeout = "fake timeout";
	}
	console.log("TimingOther: "+timingOther);
}

function stopMakingSoundOtherSpecie(value) {
	console.log("Stop making sound! (other specie)");
	timingOther = 0;
	if(timing == 0) {
		console.log("Clear timeout. (other specie)")
	}
}