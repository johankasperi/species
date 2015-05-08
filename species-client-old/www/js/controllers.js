angular.module('species.controllers', [])

.controller('StartCtrl', function($scope, $state, SpeciesService) {
	$scope.boards = [];
	$scope.selectedBoard = SpeciesService.getBoard();

	SpeciesService.on('connect', function() {
		SpeciesService.emit('client-connection', {}, null);
	});

	SpeciesService.on('client-availableBoards', function(data) {
		$scope.buttonHeight = window.innerHeight/data.boards.length;
		if($scope.buttonHeight < 100) {
			$scope.buttonHeight = "auto";
		}
		else {
			$scope.buttonHeight = $scope.buttonHeight + "px";
		}
		$scope.boards = data.boards;
	});

	this.refreshBoards = function() {
		SpeciesService.emit('client-refreshBoards', {}, null);
		setTimeout(function() {
			$scope.$broadcast('scroll.refreshComplete');
		}, 100);
	}

	this.goToDash = function(id) {
		for(var i = 0; i < $scope.boards.length; i++) {
			if(id == $scope.boards[i].id) {
				SpeciesService.setBoard($scope.boards[i]);
				$scope.selectedBoard = $scope.boards[i];
				SpeciesService.emit('client-selectBoard', { id: $scope.selectedBoard.id }, function() {
					console.log("select")
				});
				$state.transitionTo("app.dash");
				return;
			}
		}
	}
})

.controller('DashCtrl', function($scope, $state, $timeout, SpeciesService) {

	$scope.value = 0;
	$scope.bool = false;
	var previousX = null;
	var previousY = null;

	var init = function() {
		$scope.bgColor = {
			r: $scope.selectedBoard.color.r,
			g: $scope.selectedBoard.color.g,
			b: $scope.selectedBoard.color.b,
			a: 0.2
		};
	}

	$scope.selectedBoard = SpeciesService.getBoard();
	if(!$scope.selectedBoard) {
		$state.transitionTo("app.start");
	}
	else {
		init();
	}

	SpeciesService.on('specie-isTouched', function(data) {
		if(data.bool == true) {
			startMakingSound(data.value);
		}
		else {
			stopMakingSound(data.value);
		}
	});

	SpeciesService.on('otherSpecie-isTouched', function(data) {
		if(data.bool == true) {
			console.log(data)
			startMakingSoundOtherSpecie(data.color, data.value);
		}
		else {
			stopMakingSoundOtherSpecie(data.color, data.value);
		}
	});

	var canvas = document.getElementById('canvas');
	var mc = new Hammer(canvas);

	mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

	mc.on("press", function(event) {
		console.log(event)
		$scope.bool = true;
		sendData();
	});

	mc.on("pressup panend", function(event) {
		console.log("pressend");
		$scope.bool = false;
		$scope.bgColor.a = 0.2;
		sendData();
		$scope.value = 0;
	});

	mc.on("panstart", function(event) {
		$scope.bool = true;
		$scope.value = 0;
		$scope.bgColor.a = 0.2;
		sendData();
	});

	mc.on("panleft panright panup pandown", function(event) {
	  	if(!previousX) {
			previousX = event.center.x;
			previousY = event.center.y;
			return;
		}
		var diffX = event.center.x - previousX;
		var diffY = event.center.y - previousY;
		var distance = Math.sqrt(diffX*diffX + diffY*diffY);
		$scope.value += distance;
		$scope.bgColor.a = ($scope.bgColor.a + 0.1/distance < 1 ? $scope.bgColor.a + 0.1/distance : 1);
		previousX = event.x;
		previosY = event.y;
	   	sendData();
	});

	var sendData = function() {
		SpeciesService.emit('client-sendData', { room: $scope.selectedBoard.room, bool: $scope.bool, value: $scope.value, color: $scope.selectedBoard.color }, null);
	}

	var startMakingSound = function(value) {
		//console.log("Make sound!");
	}

	var stopMakingSound = function(value) {
		//console.log("Stop making sound!");
	}

	var startMakingSoundOtherSpecie = function(color, value) {
		console.log("Other specie is touched!");
		if(value > 0) {
			return;
		}
		$scope.bgColor.r = ($scope.bgColor.r + color.r*0.2 < 256 ? $scope.bgColor.r + color.r*0.2 : 255);
		$scope.bgColor.g = ($scope.bgColor.g + color.g*0.2 < 256 ? $scope.bgColor.g + color.g*0.2 : 255);
		$scope.bgColor.b = ($scope.bgColor.b + color.b*0.2 < 256 ? $scope.bgColor.b + color.b*0.2 : 255);
		console.log($scope.bgColor);
	}

	var stopMakingSoundOtherSpecie = function(color) {
		console.log("Stop making sound! (other specie)");
		$scope.bgColor.r -= color.r*0.2;
		$scope.bgColor.g -= color.g*0.2;
		$scope.bgColor.b -= color.b*0.2;
	}
})