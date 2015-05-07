angular.module('species.controllers', [])

.controller('StartCtrl', function($scope, $state, SpeciesService) {
	var species = [];
	var handle_len_rate = 2.4;
	var circlePaths = [];

	init();

	function init() {
		paper.install(window);
		paper.setup('canvas');
	}

	SpeciesService.on('connect', function() {
		SpeciesService.emit('client-connection', {}, null);
	});

	SpeciesService.on('client-availableBoards', function(data) {
		species = data.boards;
		addBalls();
	});

	function addBalls() {
		circlePaths = [];
		for (var i = 0; i < species.length; i++) {
			var circlePath = new paper.Path.Circle({
				center: species[i].position,
				radius: species[i].radius,
				fillColor: species[i].color
			});
			project.activeLayer.insertChild(0, circlePath);
			circlePaths.push({ ball: circlePath, specie: species[i] });
		}
		generateConnections(circlePaths);
	}

	var largeCircle = new paper.Path.Circle({
		center: [676, 433],
		radius: 30,
		fillColor: '#fff',
		strokeColor: "#ccc",
		visible: false
	});

	var canvas = document.getElementById('canvas');
	var mc = new Hammer(canvas);

	mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

	mc.on("panend", function(event) {
		connections.children = [];
		largeCircle.visible = false;
	});

	mc.on("panstart", function(event) {
		largeCircle.visible = true;
	});

	mc.on("panleft panright panup pandown", function(event) {
	  	largeCircle.position = event.center;
	  	generateConnections(circlePaths);
	});

	var connections = new paper.Group();
	function generateConnections(paths) {
		// Remove the last connection paths:
		connections.children = [];
		largeCircle.fillColor = "#fff";
		largeCircle.strokeWidth = 1;
		for (var i = 0; i < paths.length; i++) {
			var shapes = metaball(paths[i].ball, largeCircle, 0.5, handle_len_rate, 100, paths[i].specie);
			if (shapes) {
				connections.appendTop(shapes.connection);
				connections.appendTop(shapes.triangle);
				shapes.connection.removeOnMove();
				//paths.triangle.removeOnMove();
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
			console.log("more");
			SpeciesService.emit('client-sendData', { bool: false, value: 0, specie: specie }, null);
		}
		else {
			SpeciesService.emit('client-sendData', { bool: true, value: d*20, specie: specie }, null);
		}
		if(d <= Math.abs(radius1 - radius2)) {
			largeCircle.strokeWidth = 0;
			largeCircle.fillColor = ball1.fillColor;
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

		var triangleFill = null;
		console.log(center2.subtract(center1));
		if(d < ball2.bounds.width/2) {
			largeCircle.strokeWidth = 0;
			largeCircle.fillColor = ball1.fillColor;
		}
		else {
			triangleFill = new paper.Path({
				segments: [p2a, p2b, ball2.position],
				fillColor: ball1.fillColor,
				strokeColor: ball1.fillColor,
				strokeWidth: 2,
				closed: true
			});
		}

		var connection = new paper.Path({
			segments: [p1a, p2a, p2b, p1b],
			style: ball1.style,
			closed: true
		});
		var segments = connection.segments;
		segments[0].handleOut = getVector(angle1a - pi2, radius1);
		segments[1].handleIn = getVector(angle2a + pi2, radius2);
		segments[2].handleOut = getVector(angle2b - pi2, radius2);
		segments[3].handleIn = getVector(angle1b + pi2, radius1);
		return {
			connection: connection,
			triangle: triangleFill
		};
	}

	function getVector(radians, length) {
		return new paper.Point({
			// Convert radians to degrees:
			angle: radians * 180 / Math.PI,
			length: length
		});
	}
})