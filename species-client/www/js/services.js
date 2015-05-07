angular.module('species.services', [])

.factory('SpeciesService', function($rootScope) {
  var socket = io.connect("http://species.kspri.se");
  var rootScope = $rootScope;
  var board = null;

  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },

    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    },

    setBoard: function(b) {
      board = b;
    },

    getBoard: function() {
      return board;
    }
  };
});
