angular.module('portainer.docker').component('containerItem', {
  templateUrl: './containerItem.html',
  bindings: {
    model: '=',
    onSelect: '<',
    container: '<'
  }
});
