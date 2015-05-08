angular.module('species.controllers', [])

.controller('StartCtrl', function(SpeciesService) {
	var species = [];
	var handle_len_rate = 2.4;
	var maxDistance = 0.3625*window.innerWidth;
	var circlePaths = [];

	init();

	function init() {
		paper.install(window);
		paper.setup('canvas');
	}

	SpeciesService.on('disconnect', function() {
		this.connected = false;
	});

	SpeciesService.on('connect', function() {
		this.connected = true;
		SpeciesService.emit('client-connection', {}, null);
	});

	SpeciesService.on('client-availableBoards', function(data) {
		species = data.boards;
		addBalls();
	});

	function addBalls() {
		console.log("addBalls");
		for(var i = 0; i < circlePaths.length; i++) {
			circlePaths[i].ball.remove();
		}
		circlePaths = [];
		for (var i = 0; i < species.length; i++) {
			var x = window.innerWidth*species[i].position[0];
			var y = window.innerHeight*species[i].position[1];
			var circlePath = new Path.Circle({
				center: [x,y],
				radius: species[i].radius*window.innerWidth,
				fillColor: species[i].color
			});
			paper.view.update()
			project.activeLayer.insertChild(0, circlePath);
			circlePaths.push({ ball: circlePath, specie: species[i] });
		}
		generateConnections(circlePaths);
	}

	var panCircle = new Path.Circle({
		position: [10000, 10000],
		radius: window.innerWidth < 400 ? 50 : 70,
		fillColor: '#fff',
		strokeColor: "#ccc",
		strokeWidth: 1,
		visible: false
	});
	paper.view.update();

	var canvas = document.getElementById('canvas');
	var mc = new Hammer(canvas);

	mc.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: 0 });
	mc.get('press').set({ time: 0 });

	mc.on("press panstart", function(event) {
		panCircle.visible = true;
		panCircle.position = event.center;
		paper.view.update();
		generateConnections(circlePaths);
	});

	mc.on("pressup panend", function(event) {
		connections.children = [];
		panCircle.visible = false;
		panCircle.position = [10000, 10000],
		paper.view.update();
		generateConnections(circlePaths);
	});

	mc.on("panleft panright panup pandown", function(event) {
	  	panCircle.position = event.center;
	  	generateConnections(circlePaths);
	});

	var colors = [];
	var connections = new Group();
	project.activeLayer.insertChild(0, connections);

	function generateConnections(paths) {
		// Remove the last connection paths:
		connections.children = [];
		colors = [];
		panCircle.fillColor = "#fff";
		panCircle.strokeWidth = 1;
		paper.view.update();
		for (var i = 0; i < paths.length; i++) {
			var connection = metaball(paths[i].ball, panCircle, 0.5, handle_len_rate, maxDistance, paths[i].specie);
			if (connection) {
				connections.appendTop(connection);
				paper.view.update();
				connection.removeOnMove();
			}
		}
	}

	function metaball(ball1, ball2, v, handle_len_rate, maxDistance, specie) {
		var center1 = ball1.position;
		var center2 = ball2.position;
		var radius1 = ball1.bounds.width / 2;
		var radius2 = ball2.bounds.width / 2;
		var pi2 = Math.PI / 2;
		var d = center1.getDistance(center2);
		var u1, u2;

		if (radius1 == 0 || radius2 == 0) {
			return;
		}

		if(d > maxDistance) {
			SpeciesService.emit('client-sendData', { bool: false, value: 0, specie: specie }, null);
		}
		else {
			colors.push({ rgb: ball1.fillColor.components });
			setLargeBallColor();
			SpeciesService.emit('client-sendData', { bool: true, value: d*20, specie: specie }, null);
		}
		if (d > maxDistance || d <= Math.abs(radius1 - radius2)) {
			return;
		} else if (d < radius1 + radius2) { // case circles are overlapping
			u1 = Math.acos((radius1 * radius1 + d * d - radius2 * radius2) /
					(2 * radius1 * d));
			u2 = Math.acos((radius2 * radius2 + d * d - radius1 * radius1) /
					(2 * radius2 * d));
		} else {
			u1 = 0;
			u2 = 0;
		}

		var angle1 = center2.subtract(center1).angleInRadians;
		var angle2 = Math.acos((radius1 - radius2) / d);
		var angle1a = angle1 + u1 + (angle2 - u1) * v;
		var angle1b = angle1 - u1 - (angle2 - u1) * v;
		var angle2a = angle1 + Math.PI - u2 - (Math.PI - u2 - angle2) * v;
		var angle2b = angle1 - Math.PI + u2 + (Math.PI - u2 - angle2) * v;
		var p1a = center1.add(getVector(angle1a, radius1));
		var p1b = center1.add(getVector(angle1b, radius1));
		var p2a = center2.add(getVector(angle2a, radius2));
		var p2b = center2.add(getVector(angle2b, radius2));
		// define handle length by the distance between
		// both ends of the curve to draw
		var totalRadius = (radius1 + radius2);
		var d2 = Math.min(v * handle_len_rate, p1a.subtract(p2a).length / totalRadius);
		// case circles are overlapping:
		d2 *= Math.min(1, d * 2 / (radius1 + radius2));

		radius1 *= d2;
		radius2 *= d2;

		var connection = new Path({
			segments: [p1a, p2a, p2b, p1b],
			style: ball1.style,
			closed: true
		});

		var segments = connection.segments;
		segments[0].handleOut = getVector(angle1a - pi2, radius1);
		segments[1].handleIn = getVector(angle2a + pi2, radius2);
		segments[2].handleOut = getVector(angle2b - pi2, radius2);
		segments[3].handleIn = getVector(angle1b + pi2, radius1);
		return connection;
	}

	function getVector(radians, length) {
		return new Point({
			// Convert radians to degrees:
			angle: radians * 180 / Math.PI,
			length: length
		});
	}

	function setLargeBallColor() {
		panCircle.strokeWidth = 0;
		var panCircleColor = {r:0,g:0,b:0};
		for(var i = 0; i < colors.length; i++) {
			panCircleColor.r += colors[i].rgb[0];
			panCircleColor.g += colors[i].rgb[1];
			panCircleColor.b += colors[i].rgb[2];
		}
		panCircleColor.r /= colors.length;
		panCircleColor.g /= colors.length;
		panCircleColor.b /= colors.length;
		panCircle.fillColor = new Color(panCircleColor.r, panCircleColor.g, panCircleColor.b);
		paper.view.update();
	}
})