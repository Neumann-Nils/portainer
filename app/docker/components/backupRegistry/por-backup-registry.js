angular.module('portainer.docker').component('porBackupRegistry', {
  templateUrl: './porBackupRegistry.html',
  controller: 'porBackupRegistryController',
  bindings: {
    'image': '=',
    'registry': '=',
    'autoComplete': '<',
    'labelClass': '@',
    'inputClass': '@',
    'container': '<'
  },
  require: {
    form: '^form'
  }
});
