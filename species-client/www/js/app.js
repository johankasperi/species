// Ionic App for Species in INFO490 at UIUC
// Created by Johan Kasperi

angular.module('species', ['ionic', 'species.controllers', 'species.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    StatusBar.hide();
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/content.html"
  })

  .state('app.start', {
    url: '/start',
    views: {
      'content': {
        templateUrl: 'templates/start.html',
        controller: 'StartCtrl as start'
      }
    }
  })

  .state('app.dash', {
    url: '/dash',
    views: {
      'content': {
        templateUrl: 'templates/dash.html',
        controller: 'DashCtrl as dash'
      }
    }
  });

  $urlRouterProvider.otherwise('/app/start');

});
