var feed = require('./feed').FeedPage;

var startUp = {};

startUp.start = function () {
  if (!Options.server.websocket_ip.indexOf("127.0.0.1") ||
      !Options.server.websocket_ip.indexOf("localhost")) {
    ncc.admin = true;
  } else {
    ncc.admin = false;
    ncc.displayScreen('welcome');
    ncc.displayScreen('send');
  }

  window.remote = new ripple.Remote(Options.server.trusted,
                                    Options.server.websocket_ip,
                                    Options.server.websocket_port,
                                    true);

  remote.connect();

  feed.init(remote);

  var hostinfo = Options.server.websocket_ip + ":" +
    Options.server.websocket_port;
  ncc.status.info("connecting to " + hostinfo);
  $('#ServerDisplay').text("Connecting to: " + hostinfo);
}

module.exports = startUp;
