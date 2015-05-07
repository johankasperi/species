var express = require('express');
var socketio = require('socket.io');
var _ = require('underscore');

app = express();
var server = app.listen(8020);

// Datastructure for all Galileos and their corresponding client connected to the server
var boards = [];

// The colors for colorcoding the species in the client
var colors = ["#f9cfd0", "#e0dfef", "#ebcfd1", "#fbf8d7", "#c4e6f2", "#cce1d2"]
var colorIndex = 0;
var ballPositions = [[40, 40], [120, 200], [240, 480],
	[180, 60], [150, 300], [80, 400]];

var io = socketio.listen(server);

io.on('connection', function (socket) {

	// New Galileo connected
	socket.on('board-connection', function (data) {
		if(colorIndex > colors.length || ballPositions.length < 1) {
			console.log("Cannot handle more boards");
			return null;
		}
		console.log("Board connection!");

		var positionIndex = Math.floor((Math.random() * ballPositions.length) + 1);
		console.log(positionIndex);
		var board = {
			id: socket.id,
			color: colors[colorIndex],
			position: ballPositions[positionIndex],
			radius: Math.floor((Math.random() * 21) + 20)
		};
		console.log(board.position)
		console.log(board.color)
		ballPositions.splice(positionIndex, 1);
		boards.push(board);

		socket.broadcast.emit('client-availableBoards', { boards: boards });

		colorIndex += 1;
	});

	// Socket disconnected
	socket.on('disconnect', function () {
		console.log("Disconnect");

		// Remove the board from the boards array if the socket id belonged to an Galileo
		var isBoard = _.find(boards, function(b) { return b.id === socket.id; });
		if(isBoard) {
			boards = _.reject(boards, function(b) { return b.id === socket.id; });
			ballPositions.push(isBoard.position);
			socket.broadcast.emit('client-availableBoards', { boards: boards });
			colorIndex -= 1;
		}
	})

	// New client connected
	socket.on('client-connection', function (data) {
		console.log("New client!");
		socket.emit('client-availableBoards', { boards: boards });
	})

	// Client is sending data to board
	socket.on('client-sendData', function (data) {
		console.log("Client is sending data to board!");
		io.to(data.specie.id).emit('specie-isTouched', { bool: data.bool, value: data.value });
		//socket.broadcast.emit('otherSpecie-isTouched', { bool: data.bool, value: data.value, color: data.color});
	})
});