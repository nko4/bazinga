$(document).ready(function() {
  var seriesData = [ [] ];
  // var random = new Rickshaw.Fixtures.RandomData(150);

  // for (var i = 0; i < 150; i++) {
  //   random.addData(seriesData);
  // }

  function createChart() {
    var palette = new Rickshaw.Color.Palette( { scheme: 'classic9' } );

    // instantiate our graph!

    var graph = new Rickshaw.Graph( {
      element: document.getElementById("chart"),
      width: 900,
      height: 500,
      renderer: 'area',
      stroke: true,
      preserve: true,
      series: [
        {
          color: palette.color(),
          data: seriesData[0],
          name: 'procs'
        }
      ]
    } );

    graph.render();

    var slider = new Rickshaw.Graph.RangeSlider( {
        graph: graph,
        element: $('#slider')
    } );

    var hoverDetail = new Rickshaw.Graph.HoverDetail( {
        graph: graph,
        xFormatter: function(x) {
            return new Date(x * 1000).toString();
        }
    } );

    var annotator = new Rickshaw.Graph.Annotate( {
        graph: graph,
        element: document.getElementById('timeline')
    } );

    var legend = new Rickshaw.Graph.Legend( {
        graph: graph,
        element: document.getElementById('legend')

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
        element: $('#smoother')
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

    // var controls = new RenderControls( {
    //     element: document.querySelector('form'),
    //     graph: graph
    // } );

    return graph;
  }

  var graph;

  var socket = io.connect();
  socket.on('sample', function (sample) {
    if (sample.totals) { return; } // Ignore total lines
    seriesData[0].push({ x: sample.time / 1000, y: sample.data['0fill'] });
    if (seriesData[0].length === 1) {
      graph = createChart();
    } else {
      graph.update();
    }
  });
});
