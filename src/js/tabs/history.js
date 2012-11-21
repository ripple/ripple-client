var util = require('util');
var Tab = require('../client/tabmanager').Tab;
var id = require('../client/id').Id.singleton;

var HistoryTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(HistoryTab, Tab);

HistoryTab.prototype.parent = 'account';

HistoryTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/history.jade')();
};

HistoryTab.prototype.angular = function (module) {
  module.controller('HistoryCtrl', function ($scope)
  {
    $scope.log = [{
      type: 'sent',
      date: '4/27/12 4:26pm',
      counterparty: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV',
      amount: '600,000 XRP',
      balance: '1,235,000 XRP'
    },{
      type: 'sent',
      date: '4/27/12\n4:26pm',
      counterparty: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV',
      amount: '600,000 XRP',
      balance: '1,235,000 XRP'
    },{
      type: 'other',
      date: '4/27/12\n4:26pm',
      counterparty: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV',
      amount: '600,000 XRP',
      balance: '1,235,000 XRP'
    },{
      type: 'sent',
      date: '4/27/12\n4:26pm',
      counterparty: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV',
      amount: '600,000 XRP',
      balance: '1,235,000 XRP'
    },{
      type: 'sent',
      date: '4/27/12\n4:26pm',
      counterparty: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV',
      amount: '600,000 XRP',
      balance: '1,235,000 XRP'
    }];
  });

  module.filter('typefilter', function () {
    return function (input) {

    };
  });
};

HistoryTab.prototype.onAfterRender = function ()
{

};

module.exports = HistoryTab;
