// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('SJwehNth74wTmMCa');

var fs = require('fs');
var restify = require('restify');
var socketio = require('socket.io');
var carrier = require('carrier');
var _ = require('lodash');
var Handlebars = require('handlebars');

var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err + '\n' + err.stack);
  process.exit(1);
});

var profiles = fs.readdirSync(__dirname + '/lib/profiles').map(function (filename) {
  return _.tap(require('./lib/profiles/' + filename), function (profile) {
    profile.unamePattern = new RegExp(profile.unamePattern);
  });
});

function createConfig(uname, options) {
  var config = _.cloneDeep(_.find(profiles, function (profile) {
    return profile.tool === options.tool &&
           uname.match(profile.unamePattern);
  }));

  if (!config) return undefined;

  config.args = config.args.map(function (arg) {
    return Handlebars.compile(arg)(options);
  });

  return config;
}

function setupSocketIO(server, config, isProduction, statEmitter) {
  var io = socketio.listen(server);
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

  return io;
}

function runServer(server, port) {
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
}

function lineParser(config, statEmitter) {
  return function lineParser(line) {
    if (config.ignorePatterns.some(function(pattern) { return !!line.match(pattern); })) { return; }

    line = line.trim().split(/\s+/);
    if (line[0][0] > '9') { // headers
      config.headers = line;
      config._lastWasHeader = true;
      statEmitter.emit('headers', config.headers);
    } else {
      statEmitter.emit('sample', {
        time: new Date().getTime(),
        totals: config._lastWasHeader,
        headers: config.headers,
        data: line.map(function (value) {
          return parseFloat(value, 10);
        })
      });
      config._lastWasHeader = false;
    }
  };
}

function concatArgs(via, command, args) {
  if (via) {
    args = via.split(' ').concat(command).concat(args);
    command = args.shift();
  }
  return {command: command, args: args };
}

function getUname(via, callback) {
  var spawnArgs = concatArgs(via, 'uname', ['-a']);
  var unameProcess = spawn(spawnArgs.command, spawnArgs.args);
  var output = '';
  unameProcess.stdout.on('data', function (data) { output += data; });
  unameProcess.on('close', function () {
    uname = output;
    callback(uname);
  });
}

function spawnTool(via, config, statEmitter) {
  var spawnArgs = concatArgs(via, config.command, config.args);
  var p = spawn(spawnArgs.command, spawnArgs.args);
  carrier.carry(p.stdout, lineParser(config, statEmitter));
}

var argv = require('optimist').
  usage('Watch system stats.\nUsage: $0 [--no-open] <tool> [interval]').
  describe('open', 'Open browser').
  describe('via', 'Execute tool via command, eg: --via "ssh me@my.server"').
  boolean('open').
  string('via', null).
  default('open', true).
  argv;

getUname(argv.via, function (uname) {
  var tool = argv._[0];
  var updateInterval = argv._.length > 1 ? parseInt(argv._[1], 10) : 1;

  var config = createConfig(uname,
                            { updateInterval: updateInterval,
                              tool: tool });

  if (!config) {
    console.log('Tool not found');
    process.exit(1);
  }

  var isProduction = (process.env.NODE_ENV === 'production');
  var port = (isProduction ? 80 : 8000);

  var statEmitter = new EventEmitter();

  var server = restify.createServer();

  server.get(/\/.*/, restify.serveStatic({
    directory: './web',
    default: 'index.html'
  }));

  setupSocketIO(server, config, isProduction, statEmitter);
  runServer(server, port);

  spawnTool(argv.via, config, statEmitter);

  if (!isProduction && argv.open) {
    require('open')('http://127.0.0.1:' + port);
  }
});
