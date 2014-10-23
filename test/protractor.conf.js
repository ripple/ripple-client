
exports.config = {

	seleniumAddress: 'http://localhost:4444/wd/hub',
	baseUrl: 'http://local.ripple.com/index_debug.html#',

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
		'browserName': 'chrome',
		//'chromeOptions': {
		//    args: ['--lang=ES']
		//}
		//'browserName': 'firefox'
	},

	allScriptsTimeout: 20000,

	specs: [
		'e2e/login-user.js',
		'e2e/mainnav-settings.js',
		'e2e/mainnav-account.js',
		'e2e/mainnav-logout.js'
	],


	/* output test results in XML format. Before running, you will need  npm install jasmine-reporters  */


//    onPrepare: function(){
//        require('jasmine-reporters');
//        jasmine.getEnv().addReporter(
//            new jasmine.JUnitXmlReporter('test/out/', true, true));
//    },


	/* Options to be passed to Jasmine-node. */

	jasmineNodeOpts: {
		isVerbose: true,
		showColors: true,
		includeStackTrace: false
	}
};