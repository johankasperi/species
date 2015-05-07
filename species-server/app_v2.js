var express = require('express');
var socketio = require('socket.io');
var _ = require('underscore');

app = express();
var server = app.listen(8020);

// Datastructure for all Galileos and their corresponding client connected to the server
var boards = [];

// The colors for colorcoding the GUI
var colors = [
	{
		name: "red",
		r: 255,
		g: 0,
		b: 0
	},
	{
		name: "blue",
		r: 0,
		g: 0,
		b: 255
	},
	{
		name: "green",
		r: 0,
		g: 255,
		b: 0
	},
	{
		name: "yellow",
		r: 255,
		g: 255,
		b: 0
	},
	{
		name: "yellow",
		r: 255,
		g: 255,
		b: 0
	},
	{
		name: "orange",
		r: 255,
		g: 128,
		b: 0
	},
	{
		name: "purple",
		r: 255,
		g: 0,
		b: 255
	},
	{
		name: "lightblue",
		r: 0,
		g: 255,
		b: 255
	},
]
var colorIndex = 0;

var io = socketio.listen(server);

io.on('connection', function (socket) {

	// New Galileo connected
	socket.on('board-connection', function (data) {
		if(colorIndex > colors.length) {
			console.log("Cannot handle more boards");
			return null;
		}
		console.log("Board connection!");
		var board = {
			id: socket.id,
			color: colors[colorIndex]
		};

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