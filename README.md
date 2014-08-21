# Ripple Trade client

## Overview
The Ripple Trade client is an open-source GUI for the Ripple network that facilitates the peer-to-peer exchange of any store of value. It’s the only platform where you can trade between stores of value spanning fiat, cryptocurrencies, commodities, and unusual assets like pre-1965 silver dimes.

[Ripple Labs](https://ripplelabs.com) is the core team behind the project. For more information on the Ripple protocol, please visit our [wiki](https://ripple.com/wiki/).

We would love to have folks contribute! Check out our bounties [here](https://www.bountysource.com/teams/ripple/bounties).

Ripple Trade is available at www.rippletrade.com, or you can download the desktop version at [download.ripple.com](download.ripple.com).

Questions? Contact us as support@ripple.com.


## Getting Started

### Install Dependencies

Install Node.js, Grunt, and Git if you haven't already.

Install bower by running `bower install --allow-root`.

Fork and clone the ripple-client repository and run `npm install`.

Create a new config.js file and copy/paste from config-example.js into the same directory, located under 'src/js'.

Likewise, create a new config.json file by copying config-example.json in the same directory, located under the repo root directory.

### Build

Run 'grunt' in your command line to build the client.

Your web client is in the 'build/bundle/web/' directory. Use 'index_debug.html' for development.

If you want to watch for changes and have the client rebuild for index_debug.html, run 'grunt watch' while you make changes:

Please have a look at our ['Setting Up Local Environment' wiki post](https://github.com/ripple/ripple-client/wiki/Setting-Up-Local-Environment) for more information.


## Directory Layout

	build/         -->    compiled files
	deps/          -->    client dependencies
	docs/          -->    documentation
	src/           -->    source code
	src/js/client  -->    client classes
	src/js/entry   -->    entry points for the various client versions
	src/js/util    -->    various static, stateless utility functions
	tools/         -->    tools used in the build process


## Testing

Stay tuned...


## APIs and Libraries used by Ripple Trade client

- [blobvault](https://github.com/ripple/ripple-blobvault)
- [ripple-lib](https://github.com/ripple/ripple-lib)


## Reporting Bugs

Have a bug or a feature request? [Please create a new issue](https://ripplelabs.atlassian.net/browse/WC). Before opening any issue, please search for [existing issues](https://ripplelabs.atlassian.net/browse/WC-1193?jql=project%20%3D%20WC) and read the [Issue Guidelines](https://github.com/rippleFoundation/ripple-client/blob/develop/CONTRIBUTING.md), written by [Nicolas Gallagher](https://github.com/necolas/).


## Contributing

Ripple Labs uses [Jira](https://ripplelabs.atlassian.net) to track issues. We highly encourage our community to contribute but please look at our [Development Policy](https://github.com/ripple/ripple-client/wiki/Development-Process-Policy) and our [CONTRIBUTING.md](https://github.com/ripple/ripple-client/blob/develop/CONTRIBUTING.md) file before submitting a pull request.

We are also using [Bountysource](https://www.bountysource.com/teams/ripple/bounties) allowing our community to request bids from developers to solve open-source issues!


## Community

Keep track of development and community news.

- Read and subscribe to the [The Official Ripple Blog](https://ripple.com/blog/).
- Follow [@Ripple on Twitter](https://twitter.com/ripple)
- Follow [@RippleLabs on Twitter](https://twitter.com/ripplelabs)
- Like [Ripple Labs on Facebook](https://facebook.com/ripplelabs)
- Subscribe to [@Ripple on Reddit](http://www.reddit.com/r/Ripple)
- Have a question that's not a feature request or bug report? Send a message to [support@ripple.com](mailto:support@ripple.com)
- Chat directly with our engineers! Join us [here](https://gitter.im/ripple/developers).


## More Information

https://ripple.com/wiki/Ripple_Client


## License

[https://github.com/ripple/ripple-client/blob/develop/LICENSE](https://github.com/ripple/ripple-client/blob/develop/LICENSE)
