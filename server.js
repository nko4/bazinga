// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('SJwehNth74wTmMCa');

var fs = require('fs');
var restify = require('restify');
var socketio = require('socket.io');

var EventEmitter = require('events').EventEmitter;

var isProduction = (process.env.NODE_ENV === 'production');
var port = (isProduction ? 80 : 8000);

var server = restify.createServer();
var io = socketio.listen(server);

server.get(/\/.*/, restify.serveStatic({
  directory: './web',
  default: 'index.html'
}));

var statEmitter = new EventEmitter();

io.set('log level', isProduction ? 1 : 2);
io.sockets.on('connection', function (socket) {
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

var lastSample = 50;
setInterval(function emitSample() {
  var newSample = lastSample + (2 * Math.random() - 1) * (Math.random() * 50);
  newSample = Math.max(0, Math.min(newSample, 100));
  var event = { x: new Date().getTime(), y: newSample };
  lastSample = newSample;

  statEmitter.emit('sample', event);
}, 1000);
