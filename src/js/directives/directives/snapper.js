angular
  .module('directives', ['popup'])
  .directive('rpSnapper', ['rpId', function($id) {
  return function($scope) {
    // Initialize snapper only if user is logged in.
    var watcher = $scope.$watch(function(){return $id.loginStatus;}, function() {
      var snapper;

      if ($id.loginStatus) {
        setImmediate(function(){
          snapper = new Snap({
            element: document.getElementById('wrapper'),
            disable: 'right'
          });

          // Check
          checkSize();

          // Snapper toggle button
          $('.snapper-toggle').click(function(){
            snapper.state().state == 'closed' ? snapper.open('left') : snapper.close();
          });

          $('.mobile-nav').find('a').click(function(){
            snapper.close();
          });
        });

        // Activate if resized to mobile size
        $(window).resize(function(){
          checkSize();
        });

        var checkSize = function(){
          // screen-xs-max
          if ('object' === typeof snapper) {
            if ($(window).width() > 767) {
              snapper.close();
              snapper.disable();
            } else {
              $('.mobile-nav').show();
              snapper.enable();
            }
          }
        };

        // Remove watcher
        watcher();
      }
    });
  }
}]);
