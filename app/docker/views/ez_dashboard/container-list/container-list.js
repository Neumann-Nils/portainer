angular.module('portainer.docker').component('containerList', {
  templateUrl: './containerList.html',
  controller: 'ContainerListController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    containers: '<',
    tableKey: '@',
    templates: '<',
    selectAction: '<',
  }
});
