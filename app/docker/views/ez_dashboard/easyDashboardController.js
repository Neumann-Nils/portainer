angular.module('portainer.docker')
.controller('EasyDashboardController', ['$scope', '$q', 'ContainerService', 'ImageService', 'NetworkService', 'VolumeService', 'SystemService', 'ServiceService', 'StackService', 'TemplateService', 'EndpointService', 'Notifications', 'EndpointProvider', 'StateManager',
function ($scope, $q, ContainerService, ImageService, NetworkService, VolumeService, SystemService, ServiceService, StackService, TemplateService, EndpointService, Notifications, EndpointProvider, StateManager) {

  $scope.dismissInformationPanel = function(id) {
    StateManager.dismissInformationPanel(id);
  };

  var totalWorkers = 0;
  var finishedWorkers = 0;
  $scope.offlineMode = false;
  $scope.gradeColor = "#000000";
  
  function calculateGrade(cpuUsage, ramUsage, diskUsage, temperature) {
      var gradeVal = 0.0;
      
      //Calculate system value
      gradeVal += cpuUsage * 2;
      
      gradeVal += ramUsage * 2;
      
      gradeVal += diskUsage * 5;
      
      if (temperature < 40) {
          //Do  nothing
      }
      else if(temperature <= 50) {
          gradeVal += 25;
      }
      else if(temperature <= 60) {
          gradeVal += 50;
      }
      else if(temperature <= 70) {
          gradeVal += 200;
      }
      else if(temperature <= 80) {
          gradeVal += 400;
      }
      else {
          gradeVal += 600;
      }
      
      //Convert value to grade
      if (gradeVal <= 50) {
          $scope.gradeColor = "#00bb00";
          return "A+";
      }
      else if (gradeVal <= 100) {
          $scope.gradeColor = "#33bb00";
          return "A";
      }
      else if (gradeVal <= 150) {
          $scope.gradeColor = "#66bb00";
          return "B+";
      }
      else if (gradeVal <= 200) {
          $scope.gradeColor = "#99bb00";
          return "B";
      }
      else if (gradeVal <= 250) {
          $scope.gradeColor = "#bbaa00";
          return "C+";
      }
      else if (gradeVal <= 300) {
          $scope.gradeColor = "#bb8800";
          return "C";
      }
      else if (gradeVal <= 400) {
          $scope.gradeColor = "#bb4400";
          return "D";
      }
      else if (gradeVal <= 500) {
          $scope.gradeColor = "#bb0000";
          return "E";
      }
      else {
          $scope.gradeColor = "#ff0000";
          return "F";
      }
  }
  
  function initView() {
    var endpointMode = $scope.applicationState.endpoint.mode;
    var endpointId = EndpointProvider.endpointID();

    $q.all({
      containers: ContainerService.containers(1),
      images: ImageService.images(false),
      volumes: VolumeService.volumes(),
      networks: NetworkService.networks(true, true, true),
      services: endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER' ? ServiceService.services() : [],
      stacks: StackService.stacks(true, endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER', endpointId),
      info: SystemService.info(),
      endpoint: EndpointService.endpoint(endpointId),
      templates: TemplateService.templates()
    })
    .then(function success(data) {
      $scope.containers = data.containers;
      $scope.containers.info = {};
      $scope.images = data.images;
      $scope.volumeCount = data.volumes.length;
      $scope.networkCount = data.networks.length;
      $scope.serviceCount = data.services.length;
      $scope.stackCount = data.stacks.length;
      $scope.info = data.info;
      $scope.endpoint = data.endpoint;
      $scope.templates = data.templates;
      $scope.offlineMode = EndpointProvider.offlineMode();
      $scope.cpuUsage = 0.0;
      $scope.memUsage = 0;
      $scope.systemGrade = "-";
      
      finishedWorkers = 0;
      totalWorkers = data.containers.length;
      data.containers.forEach(function(item)
      {
          $q.all({
            container: ContainerService.containerStats(item.Id)
          })
          .then(function success(dat) {
            var cpuDelta = dat.container.CurrentCPUTotalUsage - dat.container.PreviousCPUTotalUsage;
            var systemDelta = dat.container.CurrentCPUSystemUsage - dat.container.PreviousCPUSystemUsage;

            if (systemDelta > 0.0 && cpuDelta > 0.0)
            {
              $scope.cpuUsage += (cpuDelta / systemDelta) * 100.0;
            }
            $scope.memUsage += dat.container.MemoryUsage;

          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to load dashboard data');
          })
          .finally(function f() {
              finishedWorkers++;
              if(finishedWorkers === totalWorkers)
              {
                $scope.systemGrade = calculateGrade($scope.cpuUsage, $scope.memUsage / data.endpoint.Snapshots[0].TotalMemory, 1, 40);
              }
          });

          item.info = {};
          item.info.isRunning = (item.State === "running" ? true : false);
          item.info.name = item.Names[0];
          item.info.comment = "Comment here please";
          for (let i = 0; i < $scope.templates.length; i++)
          {
            if($scope.templates[i].Image === item.Image)
            {
              item.info.logo = $scope.templates[i].Logo;
              item.info.comment = $scope.templates[i].Description;
              break;
            }
          }
      });
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load dashboard data');
    });
    
  }

  initView();
}]);
