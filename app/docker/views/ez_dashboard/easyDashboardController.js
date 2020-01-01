angular.module('portainer.docker')
.controller('EasyDashboardController', ['$scope', '$q', 'GradingHelper', 'ContainerService', 'ImageService', 'NetworkService', 'VolumeService', 'SystemService', 'ServiceService', 'StackService', 'TemplateService', 'EndpointService', 'Notifications', 'EndpointProvider', 'StateManager',
function ($scope, $q, GradingHelper, ContainerService, ImageService, NetworkService, VolumeService, SystemService, ServiceService, StackService, TemplateService, EndpointService, Notifications, EndpointProvider, StateManager) {

  $scope.dismissInformationPanel = function(id) {
    StateManager.dismissInformationPanel(id);
  };

  $scope.offlineMode = false;
  $scope.gradeColor = {};
  $scope.gradeColor.grade = "#000000"
  $scope.gradeColor.cpu = "#000000"
  $scope.gradeColor.ram = "#000000"
  $scope.gradeColor.disk = "#000000"
  $scope.gradeColor.temperature = "#000000"

  function showWarningsAndErrors()
  {
    //CPU warnings
    if($scope.systemGrade.cpu.score >= 400) {
      if($scope.systemGrade.cpu.score > 500) {
        Notifications.error("CPU-Auslastung sehr hoch", new Error("Die CPU-Auslastung ist sehr hoch! Bitte kontrollieren Sie ihre Anwendungen auf deren CPU-Auslastung"), "");
      }
      else {
        Notifications.warning("CPU-Auslastung erhöht", "Die CPU-Auslastung ist erhöht");
      }
    }

    if($scope.systemGrade.ram.score >= 300) {
      if($scope.systemGrade.ram.score > 500) {
        Notifications.error("RAM-Auslastung kritisch!", new Error("Die Nutzung des Arbeitsspeichers ist kritisch. Es kann es zu einem unvorhersagbaren Verhalten der Anwenungen kommen!"), "");
      }
      else {
        Notifications.warning("RAM-Auslastung erhöht", "Die Nutzung des Arbeitsspeichers ist erhöht. Sollte er in einen kritischen Bereich steigen, kann es zu einem unvorhersagbaren Verhalten der Anwenungen kommen!");
      }
    }

    if($scope.systemGrade.disk.score >= 200) {
      if($scope.systemGrade.disk.score >= 500) {
        Notifications.error("Festplatte ist voll!", new Error("Ihre Festplatte ist voll. Bitte erweitern Sie ihren Speicher, da Anwendungen sonst ggf. nicht richtig funktionieren"), "");
      }
      else {
        Notifications.warning("Festplatte füllt sich", "Ihre Festplatte füllt sich und könnte bald voll sein. Erweitern Sie ggf. ihren Speicher");
      }
    }

    if($scope.systemGrade.temperature.score >= 100) {
      if($scope.systemGrade.temperature.score >= 400) {
        Notifications.error("CPU-Temperatur kritisch!", new Error("Bitte kontrollieren Sie ihre HofBox und sorgen Sie ggf. für eine bessere Kühlung"), "");
      }
      else {
        Notifications.warning("Temperatur", "Die CPU-Temperatur ist erhöht");
      }
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
      $scope.cpuTotal = data.info.NCPU;
      $scope.cpuUsage = data.endpoint.SystemInfo.CPUInfo.Utilization.LastMin;
      $scope.cpuTemp = data.endpoint.SystemInfo.CPUInfo.Temperature;
      $scope.memUsage = data.endpoint.SystemInfo.MemoryUsage.Used;
      $scope.memTotal = data.endpoint.SystemInfo.MemoryUsage.Total;
      $scope.diskUsed = data.endpoint.SystemInfo.DiskUsage.Used;
      $scope.diskTotal = data.endpoint.SystemInfo.DiskUsage.Total;
      $scope.uptime = data.endpoint.SystemInfo.Uptime;
      $scope.systemGrade = GradingHelper.calculateGrade(data.endpoint.SystemInfo.CPUInfo.Utilization, $scope.memUsage / $scope.memTotal, $scope.diskUsed / $scope.diskTotal, $scope.cpuTemp);

      showWarningsAndErrors();
      
      data.containers.forEach(function(item)
      {
        item.info = {};
        item.info.isRunning = (item.State === "running" ? true : false);
        item.info.name = item.Names[0];
        item.info.comment = "Comment here please";
        for (let i = 0; i < $scope.templates.length; i++)
        {
          if($scope.templates[i].RegistryModel.Image === item.Image)
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
