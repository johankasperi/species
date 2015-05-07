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
			hasClient: false,
			client: {},
			room: "board"+socket.id,
			color: colors[colorIndex]
		};
		socket.join(board.room);

		boards.push(board);

		socket.broadcast.emit('client-availableBoards', { boards: findAvailableBoards() });

		colorIndex += 1;
	});

	// Socket disconnected
	socket.on('disconnect', function () {
		console.log("Disconnect");

		// Remove the board from the boards array if the socket id belonged to an Galileo
		var isBoard = _.find(boards, function(b) { return b.id === socket.id; });
		if(isBoard) {
			boards = _.reject(boards, function(b) { return b.id === socket.id; });
			socket.broadcast.emit('client-availableBoards', { boards: findAvailableBoards() });
			colorIndex -= 1;
		}
		else {
			for(var i = 0; i < boards.length; i++) {
				if(boards[i].client.id == socket.id) {
					boards[i].hasClient = false;
					boards[i].client = {};
				}
			}
		}
	})

	// New client connected
	socket.on('client-connection', function (data) {
		console.log("New client!");
		socket.emit('client-availableBoards', { boards: findAvailableBoards() });
	})

	// Client has selected board
	socket.on('client-selectBoard', function (data) {
		console.log("Client selected a board!");

		for(var i = 0; i < boards.length; i++) {
			if(boards[i].id == data.id) {
				boards[i].hasClient = true;
				boards[i].client = {
					id: socket.id
				};

				socket.join(boards[i].room);
			}
		}
		socket.broadcast.emit('client-availableBoards', { boards: findAvailableBoards() });
	})

	// Client wants to update the board list
	socket.on('client-refreshBoards', function (data) {
		socket.emit('client-availableBoards', { boards: findAvailableBoards() });
	})

	// Client is sending data to board
	socket.on('client-sendData', function (data) {
		console.log("Client is sending data to board!");
		io.to(data.room).emit('specie-isTouched', { bool: data.bool, value: data.value });

		var allOtherBoards = findBoardsThatNotHaveRoom(data.room);
		_.each(allOtherBoards, function(board) {
			io.to(board.room).emit('otherSpecie-isTouched', { bool: data.bool, value: data.value, color: data.color});
		})
	})
});

function findAvailableBoards() {
	return _.filter(boards, function(b) { return b.hasClient == false });
}

function findBoardsThatNotHaveRoom(room) {
	return _.filter(boards, function(b) { return b.room !== room });
}

function findBoardByClientId(id) {
	return _.filter(boards, function(b) { return b.client.id == id });
}