var webutil = require('./webutil'),
    rewriter = require('./jsonrewriter');

/**
 * Manages the notifications appearing in the top right status box.
 */
var StatusManager = function ()
{
  this.el = null;
  this.queue = [];

  // If true, the next tick is already scheduled, so we do not need to trigger
  // one manually if a new element is added.
  this.tickUpcoming = false;

  this.tickInterval = 4000;
};

StatusManager.prototype.init = function ()
{
  var self = this;
  var app = this.app;

  var $scope = this.scope = app.$scope.$new();

  // Activate #status panel
  $scope.$apply(function () {
    var template = require('../../jade/client/status.jade')();
    self.el = app.$compile(template)($scope);
    self.el.appendTo('header');
  });

  app.id.on('userchange', function (e) {
    $scope.username = e.username;
  });

  // A notification might have been queued already before the app was fully
  // initialized. If so, we display it now.
  if (this.queue.length) this._tick();

  self.notifyEl = $('<div>').attr('id', 'notification').insertAfter(this.el);
  $(window).scroll(function () {
    self.notifyEl.css('top', Math.max(55, $(window).scrollTop()-47)+'px');
  });

  this.setupNetworkNotices();
};

StatusManager.prototype.setApp = function (app)
{
  this.app = app;
};

StatusManager.prototype.create = function (message, type)
{
  return new StatusMessage(this, message, type);
};

/**
 * Add the status object to the queue.
 *
 * You should not need to call this yourself, use Status::queue().
 */
StatusManager.prototype.enqueue = function (smObj)
{
  this.queue.push(smObj);
  if (this.el && !this.tickUpcoming) this._tick();
};

/**
 * Proceed to next notification.
 *
 * Used internally, you should never have to call this yourself.
 */
StatusManager.prototype._tick = function ()
{
  var self = this;

  if (this.prevEl) {
    var prevEl = this.prevEl;
    // Hide notification box
    prevEl.removeClass('active');
    setTimeout(function () {
      prevEl.remove();
    }, 1000);
    this.prevEl = null;
  }

  this.tickUpcoming = false;
  if (this.queue.length) {
    // Show next status message
    var next = this.queue.shift();

    var el = $(next.message);
    el.addClass('notification');
    el.appendTo(this.notifyEl);
    setTimeout(function () {
      el.addClass('active');
    }, 0);

    this.prevEl = el;

    this.tickUpcoming = true;
    setTimeout(this._tick.bind(this), this.tickInterval);
  }
};

StatusManager.tplAccount = require('../../jade/notification/account.jade');

/**
 * Listens to and graphically displays some network-related notifications.
 */
StatusManager.prototype.setupNetworkNotices = function ()
{
  var app = this.app;
  var remote = this.app.net.remote;

  remote.on('account', function (msg) {
    var tx = rewriter.processTxn(msg.transaction, msg.meta, app.id.account);
    var $scope = app.$scope.$new();
    $scope.tx = tx;

    var html = StatusManager.tplAccount($scope);

    if (html.length) {
      app.sm.create(app.$compile(html)($scope)).queue();
    }

    if ("undefined" !== typeof tx.balance) {
      app.$scope.balance = tx.balance;
    }
  });
};


var StatusMessage = function (sm, message, type)
{
  this.sm = sm;
  this.message = message || "";
  this.type = type || "info";
};

StatusMessage.prototype.setMessage = function (message)
{
  this.message = message;
};

StatusMessage.prototype.setType = function (type)
{
  this.type = type;
};

StatusMessage.prototype.queue = function ()
{
  // Send myself to the StatusManager
  this.sm.enqueue(this);
};

exports.StatusManager = StatusManager;
exports.StatusMessage = StatusMessage;
