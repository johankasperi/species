var express = require('express');
var socketio = require('socket.io');
var _ = require('underscore');

app = express();
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8020;
var server = app.listen( port, ipaddress, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

// Datastructure for all Galileos and their corresponding client connected to the server
var boards = [];

// The colors for colorcoding the species in the client
var colors = ["#f9cfd0", "#e0dfef", "#ebcfd1", "#fbf8d7", "#c4e6f2", "#cce1d2"]
var positions = [[0.185, 0.124], [0.825, 0.35], [0.75, 0.85],
	[0.56, 0.10], [0.47, 0.53], [0.25, 0.7]];
//var positionIndex = 0;

var io = socketio.listen(server);

io.on('connection', function (socket) {

	// New Galileo connected
	socket.on('board-connection', function (data) {
		if(colorIndex > colors.length || positions.length < 1) {
			console.log("Cannot handle more boards");
			return null;
		}
		console.log("Board connection!");

		var positionIndex = Math.floor((Math.random() * positions.length));
		var colorIndex = Math.floor((Math.random() * colors.length));
		var board = {
			id: socket.id,
			color: colors[colorIndex],
			position: positions[positionIndex],
			radius: (Math.floor((Math.random() * (10 - 6 + 1))) + 6) / 70
		};
		positions.splice(positionIndex, 1);
		colors.splice(colorIndex, 1);
		boards.push(board);

		socket.broadcast.emit('client-availableBoards', { boards: boards });
	});

	// Socket disconnected
	socket.on('disconnect', function () {
		console.log("Disconnect");

		// Remove the board from the boards array if the socket id belonged to an Galileo
		var isBoard = _.find(boards, function(b) { return b.id === socket.id; });
		if(isBoard) {
			boards = _.reject(boards, function(b) { return b.id === socket.id; });
			socket.broadcast.emit('client-availableBoards', { boards: boards });
			colors.push(isBoard.color);
			positions.push(isBoard.position);
		}
	})

	// New client connected
	socket.on('client-connection', function (data) {
		console.log("New client!");
		socket.emit('client-availableBoards', { boards: boards });
	})

	// Client is sending data to board
	socket.on('client-sendData', function (data) {
		console.log("Client is sending data!");
		io.to(data.specie.id).emit('specie-isTouched', { bool: data.bool, value: data.value, client: socket.id });
		_.each(boards, function(board) {
			if(board.id !== data.specie.id) {
				io.to(board.id).emit('otherSpecie-isTouched', { bool: data.bool, value: data.value });
			}
		})
	})
});