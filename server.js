// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('SJwehNth74wTmMCa');

var fs = require('fs');
var restify = require('restify');
var socketio = require('socket.io');
var carrier = require('carrier');

var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

var isProduction = (process.env.NODE_ENV === 'production');
var port = (isProduction ? 80 : 8000);

var server = restify.createServer();
var io = socketio.listen(server);

server.get(/\/.*/, restify.serveStatic({
  directory: './web',
  default: 'index.html'
}));

var updateInterval = 1;
var config = createMacVmStatConfig();

var statEmitter = new EventEmitter();

io.set('log level', isProduction ? 1 : 2);
io.sockets.on('connection', function (socket) {
  socket.emit('config', config.renderingConfig);

  function sendSample(sample) {
    socket.emit('sample', sample);
  }
  statEmitter.on('sample', sendSample)

  socket.on('disconnect', function () {
    statEmitter.removeListener('sample', sendSample);
  });
});

server.listen(port, function (err) {
  if (err) { console.error(err); process.exit(-1); }

  // if run as root, downgrade to the owner of this file
  if (process.getuid() === 0) {
    require('fs').stat(__filename, function(err, stats) {
      if (err) { return console.error(err); }
      process.setuid(stats.uid);
    });
  }

  console.log('Server running at http://0.0.0.0:' + port + '/');
});

function createMacVmStatConfig() {
  function MacVmStatConfig() {
    this.command = 'vm_stat';
    this.args = [updateInterval];
    this.headers = null;
    this._lastWasHeader = false;
    this.renderingConfig = {
      order: ['totals', 'pages', 'compressor', 'swap'],
      charts: {
        totals: {
          type: 'stacked',
          fields: ['free', 'active', 'inactive', 'specul', 'throttle', 'wired', 'prgable'],
        },
        pages: {
          type: 'line',
          fields: ['faults', 'copy', '0fill', 'reactive', 'purged', 'file-backed', 'anonymous']
        },
        compressor: {
          type: 'line',
          fields: ['cmprssed', 'cmprssor', 'dcomprs', 'comprs']
        },
        swap: {
          type: 'line',
          fields: ['pageins', 'pageout', 'swapins', 'swapouts']
        }
      }
    };
  }

  MacVmStatConfig.prototype.lineParser = function lineParser(line) {
    var self = this;

    if (line.match(/Mach Virtual Memory Statistics/)) { return; }

    line = line.trim().split(/\s+/);
    if (line[0][0] > '9') { // headers
      this.headers = line;
      this._lastWasHeader = true;
      statEmitter.emit('headers', this.headers);
    } else {
      statEmitter.emit('sample', {
        time: new Date().getTime(),
        totals: this._lastWasHeader,
        data: line.reduce(function (event, value, idx) {
          event[self.headers[idx]] = parseInt(value, 10);
          return event;
        }, {})
      });
      this._lastWasHeader = false;
    }
  }

  return new MacVmStatConfig();
}

var p = spawn(config.command, config.args);
carrier.carry(p.stdout, function (line) { config.lineParser(line); });
