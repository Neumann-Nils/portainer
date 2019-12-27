angular.module('portainer.app')
.controller('UserSettingsController', ['$scope', '$state', 'Notifications', 'LocalStorage', 'StateManager', 
function ($scope, $state, Notifications, LocalStorage, StateManager) {

  $scope.state = {
    actionInProgress: false
  }

  $scope.formValues = {
    expertMode: StateManager.getState().expertMode
  };

  $scope.saveUserSettings = function() {
    $scope.state.actionInProgress = true;
    StateManager.updateExpertMode($scope.formValues.expertMode);
    $state.reload();
    $scope.state.actionInProgress = false;
  };
}]);
