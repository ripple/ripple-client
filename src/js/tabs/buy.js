var util = require('util'),
    Tab = require('../client/tab').Tab;

var BuyTab = function ()
{
  Tab.call(this);
};

util.inherits(BuyTab, Tab);

BuyTab.prototype.tabName = 'buy';
BuyTab.prototype.mainMenu = 'buy';

BuyTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

BuyTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/buy.jade')();
};

BuyTab.prototype.angular = function (module)
{
  module.controller('BuyCtrl', ['$rootScope', 'rpId',
    function ($scope, $id)
    {

      if (!$id.loginStatus) return $id.goId();

      var STRIPE_LOGO_IMAGE = 'img/mobile/icon60.png';
      $scope.STRIPE_API_PUBLIC_KEY = 'pk_live_dzfTEzp9g8RiyQeZCrmLBilF';


      $scope.convertDollarsToXrp = function(dollars) {
        return Math.round((dollars / 0.006) * 0.97);
      }

      function StripeInboundBridgeClient(options) {
        if (!options.stripeApiKey) {
          throw new Error('MissingStripeApiKey');
        }
        this.stripeApiKey = options.stripeApiKey;
      }

      StripeInboundBridgeClient.prototype = {
        postGatewayPayment: function(payment, callback) {
          console.log(payment);
          $.ajax({
            url: 'https://ripplelaunch.com/stripe',
            type: 'POST',
            data: payment.toJSON(),
            success: function(response){
              callback(null, response);
            },
            error: function(error){
              callback(error, null);
            }
          });
        }
      };

      $scope.inboundBridgeClient = new StripeInboundBridgeClient({
        stripeApiKey: $scope.STRIPE_API_PUBLIC_KEY
      });


      function GatewayPayment(options) {
        this.destinationAddress = options.destinationAddress;
        this.sourceAddress = options.sourceAddress;
        this.sourceAmount = options.sourceAmount;
        this.destinationAmount = options.destinationAmount;
      }

      GatewayPayment.prototype = {
        toJSON: function() {
          return {
            rippleAddress: this.destinationAddress,
            amount: this.sourceAmount,
            stripeToken: this.sourceAddress
          }
        }
      }



      $scope.handler = StripeCheckout.configure({

        key: $scope.STRIPE_API_PUBLIC_KEY, 
        //image: '/img/mobile/icon60.png',
        token: function (token) {
          var payment = new GatewayPayment({
            destinationAddress: $id.account,
            sourceAmount: $scope.dollars,
            sourceAddress: token.id
          });
          $scope.inboundBridgeClient.postGatewayPayment(payment, function(error, response) {
            if (error) {
              alert('ERROR! Your credit card was not charged.');
            }

            if (response) {
              console.log('response',response);
            }
          });
        }
      });

      $scope.loadStripe = function(dollars) {

        $scope.dollars = parseInt(dollars, 10);
        $scope.xrp = $scope.convertDollarsToXrp($scope.dollars);

        $scope.handler.open ({
          name: 'Buy XRPs',
          description: $scope.convertDollarsToXrp(dollars)+' XRP ($'+dollars+'.00)',
          amount: dollars * 100
        });

        console.log($scope.dollars);
        console.log(dollars);
      }
    }]);
};

module.exports = BuyTab;
