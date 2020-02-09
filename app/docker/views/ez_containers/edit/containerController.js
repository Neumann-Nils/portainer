import moment from 'moment';

angular.module('portainer.docker')
.controller('EasyContainerController', ['$q', '$scope', '$state','$transition$', '$filter', 'Commit', 'ContainerHelper', 'ContainerService', 'ImageHelper', 'NetworkService', 'Notifications', 'ModalService', 'ResourceControlService', 'RegistryService', 'ImageService', 'HttpRequestHelper', 'TemplateService',
function ($q, $scope, $state, $transition$, $filter, Commit, ContainerHelper, ContainerService, ImageHelper, NetworkService, Notifications, ModalService, ResourceControlService, RegistryService, ImageService, HttpRequestHelper, TemplateService) {
  $scope.activityTime = 0;   
  $scope.portBindings = [];

  $scope.config = {
    Image: '',
    Registry: ''
  };

  $scope.state = {
  };

  var update = function () {
    var nodeName = $transition$.params().nodeName;
    HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);
    $scope.nodeName = nodeName;

    $q.all({
      container: ContainerService.container($transition$.params().id),
      images: ImageService.images(false),
      templates: TemplateService.templates()
    })
    .then(function success(data) {
      var container = data.container;
      $scope.container = container;
      $scope.container.edit = false;
      $scope.container.newContainerName = $filter('trimcontainername')(container.Name);
      $scope.container.Application = {};
      $scope.container.Application.Name = "Unknown application";
      $scope.container.Application.Comment = "";
      $scope.container.Backups = [];
      $scope.container.MyImages = data.images;

      if (container.State.Running) {
        $scope.activityTime = moment.duration(moment(container.State.StartedAt).utc().diff(moment().utc())).humanize();
      } else if (container.State.Status === 'created') {
        $scope.activityTime = moment.duration(moment(container.Created).utc().diff(moment().utc())).humanize();
      } else {
        $scope.activityTime = moment.duration(moment().utc().diff(moment(container.State.FinishedAt).utc())).humanize();
      }

      for (let i = 0; i < data.templates.length; i++)
      {
        if(data.templates[i].RegistryModel.Image === container.Config.Image)
        {
          $scope.container.Application.Name = data.templates[i].Title;
          $scope.container.Application.Comment = data.templates[i].Description;
        }
      }

      data.images.forEach(function(image)
      {
        image.RepoTags.forEach(function(tag)
        {
          var tmp = tag.split(":");
          if(tmp[1] === container.Id)
          {
            var backup = {};
            backup.Name = tmp[0];
            backup.Size = image.VirtualSize;
            backup.Created = image.Created;
            $scope.container.Backups.push(backup);
          }
        });
      });
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve container info');
    });
  };

  function executeContainerAction(id, action, successMessage, errorMessage) {
    action(id)
    .then(function success() {
      Notifications.success(successMessage, id);
      update();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, errorMessage);
    });
  }

  $scope.start = function () {
    var successMessage = 'Container successfully started';
    var errorMessage = 'Unable to start container';
    executeContainerAction($transition$.params().id, ContainerService.startContainer, successMessage, errorMessage);
  };

  $scope.stop = function () {
    var successMessage = 'Container successfully stopped';
    var errorMessage = 'Unable to stop container';
    executeContainerAction($transition$.params().id, ContainerService.stopContainer, successMessage, errorMessage);
  };

  $scope.pause = function() {
    var successMessage = 'Container successfully paused';
    var errorMessage = 'Unable to pause container';
    executeContainerAction($transition$.params().id, ContainerService.pauseContainer, successMessage, errorMessage);
  };

  $scope.unpause = function() {
    var successMessage = 'Container successfully resumed';
    var errorMessage = 'Unable to resume container';
    executeContainerAction($transition$.params().id, ContainerService.resumeContainer, successMessage, errorMessage);
  };

  $scope.restart = function () {
    var successMessage = 'Container successfully restarted';
    var errorMessage = 'Unable to restart container';
    executeContainerAction($transition$.params().id, ContainerService.restartContainer, successMessage, errorMessage);
  };

  $scope.renameContainer = function () {
    var container = $scope.container;
    ContainerService.renameContainer($transition$.params().id, container.newContainerName)
    .then(function success() {
      container.Name = container.newContainerName;
      Notifications.success('Container successfully renamed', container.Name);
    })
    .catch(function error(err) {
      container.newContainerName = container.Name;
      Notifications.error('Failure', err, 'Unable to rename container');
    })
    .finally(function final() {
      $scope.container.edit = false;
    });
  };

  $scope.commit = function () {
    var image = $scope.config.Image;
    $scope.config.Image = '';
    var registry = $scope.config.Registry;
    var imageConfig = ImageHelper.createImageConfigForCommit(image, registry.URL);

    Commit.commitContainer({id: $transition$.params().id, tag: $scope.container.Id, repo: imageConfig.repo}, function () {
      update();
      Notifications.success('Backup created', $transition$.params().id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Unable to create backup');
    });
  };


  $scope.confirmRemove = function () {
    var title = 'You are about to remove a container.';
    if ($scope.container.State.Running) {
      title = 'You are about to remove a running container.';
    }
    ModalService.confirmContainerDeletion(
      title,
      function (result) {
        if(!result) { return; }
        var cleanAssociatedVolumes = false;
        if (result[0]) {
          cleanAssociatedVolumes = true;
        }
        removeContainer(cleanAssociatedVolumes);
      }
    );
  };

  function removeContainer(cleanAssociatedVolumes) {
    ContainerService.remove($scope.container, cleanAssociatedVolumes)
    .then(function success() {
      Notifications.success('Container successfully removed');
      $state.go('docker.containers', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove container');
    });
  }

  update();
}]);
