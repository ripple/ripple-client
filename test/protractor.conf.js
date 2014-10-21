
exports.config = {

    seleniumAddress: 'http://localhost:4444/wd/hub',
    baseUrl: 'http://local.ripple.com/',

    // Credentials of a funded test account
    user: {
        username: '',
        password: '',
        // Blobvault url
        url: '',
        // Login once, and copy these from your local storage "ripple_auth"
        keys: {
            "id":"",
            "crypt":""
        }
    },

    capabilities: {
        'browserName': 'chrome'
    },

    allScriptsTimeout: 20000,

    specs: [
        'e2e/logout.js'
    ],


/* output test results in XML format. Before running, you will need  npm install jasmine-reporters  */

//    onPrepare: function(){
//        require('jasmine-reporters');
//        jasmine.getEnv().addReporter(
//            new jasmine.JUnitXmlReporter('test/out/', true, true));
//    },



/* Options to be passed to Jasmine-node. */

//    jasmineNodeOpts: {
//        isVerbose: true,
//        showColors: true,
//        includeStackTrace: false
//    }
};