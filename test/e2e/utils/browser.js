module.exports = function(ptor) {
    function waitForNavigation(part) {
        ptor.wait(function() {
            return ptor.driver.getCurrentUrl().then(function(url) {
                return !!url.match(part);
            });
        });
    }
    return {
        waitForNavigation: waitForNavigation
    };
};