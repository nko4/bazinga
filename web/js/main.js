angular.module('statCharterApp', ['btford.socket-io']).
  run(['socket', function (socket) {
    socket.forward(['config', 'sample']);
  }]).
  controller('StatCharterController', ['$scope',
                             function ( $scope ) {

    $scope.host = 'foobar.com';

    function createChart(element, fields, data, chartType) {
      var palette = new Rickshaw.Color.Palette( { scheme: 'munin' } );

      // instantiate our graph!

      var graph = new Rickshaw.Graph( {
        element: element.find('.chart')[0],
        renderer: chartType === 'line' ? 'line' : 'area',
        stroke: chartType !== 'stacked',
        preserve: true,
        series: data.map(function (serie, idx) {
          return {
            color: palette.color(),
            data: serie,
            name: fields[idx],
            stroke: chartType !== 'stacked'
          };
        })
      } );

      if (chartType !== 'stacked') graph.renderer.unstack = true;
      graph.render();

      var slider = new Rickshaw.Graph.RangeSlider( {
          graph: graph,
          element: element.find('.slider')[0]
      } );

      var hoverDetail = new Rickshaw.Graph.HoverDetail( {
          graph: graph,
          xFormatter: function(x) {
              return new Date(x * 1000).toString();
          }
      } );

      var legend = new Rickshaw.Graph.Legend( {
          graph: graph,
          element: element.find('.legend')[0]

      } );

      var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
          graph: graph,
          legend: legend
      } );

      var order = new Rickshaw.Graph.Behavior.Series.Order( {
          graph: graph,
          legend: legend
      } );

      var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {
          graph: graph,
          legend: legend
      } );

      var smoother = new Rickshaw.Graph.Smoother( {
          graph: graph,
          element: element.find('.smoother')[0]
      } );

      var ticksTreatment = 'glow';

      var xAxis = new Rickshaw.Graph.Axis.Time( {
        graph: graph,
        ticksTreatment: ticksTreatment,
        timeFixture: new Rickshaw.Fixtures.Time.Local()
      } );

      xAxis.render();

      var yAxis = new Rickshaw.Graph.Axis.Y( {
        graph: graph,
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        ticksTreatment: ticksTreatment
      } );

      yAxis.render();

      return graph;
    }

    var update = function firstUpdate() {
      $scope.config.order.forEach(function (chartName, chartIdx) {
        $scope.charts[chartIdx].graph =
          createChart($('#' + chartName),
                      $scope.config.charts[chartName].fields,
                      $scope.charts[chartIdx].data,
                      $scope.config.charts[chartName].type
                     );
      });

      update = nextUpdate;
    };

    function nextUpdate() {
      $scope.charts.forEach(function (chart) {
        chart.graph.update();
      });
    }

    $scope.$on('socket:config', function (event, config) {
      $scope.config = config;
      $scope.charts = config.order.map(function (chartName) {
        return {
          name: chartName,
          data: _.range(config.charts[chartName].fields.length).
            map(function () { return []; }),
          graph: null
        };
      });

      var sampleFieldIdx = 0;
      $scope.fieldMap = config.order.reduce(function (map, chartName, chartIdx) {
        config.charts[chartName].fields.forEach(function (field, fieldIdx) {
          map[sampleFieldIdx++] = $scope.charts[chartIdx].data[fieldIdx];
        });
        return map;
      }, {});

      update = firstUpdate;
    });

    $scope.$on('socket:sample', function (event, sample) {
      if (sample.totals) { return; } // Ignore total lines

      sample.data.forEach(function (value, idx) {
        $scope.fieldMap[idx].push({ x: sample.time / 1000, y: value });
      });

      if ($scope.fieldMap[0].length > 1000) {
        _.values($scope.fieldMap).forEach(function (v) {
          v.shift();
        });
      }

      update();
    });
  }]);
