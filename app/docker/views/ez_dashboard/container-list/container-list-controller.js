//import _ from 'lodash-es';

angular.module('portainer.docker').controller('ContainerListController', ['DatatableService',
  function ContainerListController(DatatableService) {
    //var ctrl = this;

    this.state = {
      textFilter: ''
    };

    this.onTextFilterChange = function() {
      DatatableService.setDataTableTextFilters(this.tableKey, this.state.textFilter);
    }

    this.$onInit = function() {

      var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
      if (textFilter !== null) {
        this.state.textFilter = textFilter;
      }
    };
  }
]);
