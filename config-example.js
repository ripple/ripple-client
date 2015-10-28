/**
 * Ripple Client Configuration
 *
 * Copy this file to config.js and edit to suit your preferences.
 */
var Options = {
  // Local domain
  //
  // Which domain should ripple-client consider native?
  domain: 'local.ripple.com',

  // Rippled to connect
  server: {
    trace: true,
    trusted: true,
    local_signing: true,

    servers: [
      { host: 's-west.ripple.com', port: 443, secure: true },
      { host: 's-east.ripple.com', port: 443, secure: true }
    ],

    connection_offset: 0,
    allow_partial_history: false
  },

  // DEPRECATED: Blobvault server (old blob protocol)
  //
  // The blobvault URL for the new login protocol is set via authinfo. You can
  // still use this setting for the fallback feature.
  blobvault: 'https://blobvault.ripple.com',

  // If set, login will persist across sessions (page reload). This is mostly
  // intended for developers, be careful about using this in a real setting.
  persistent_auth: false,

  historyApi: 'https://history.ripple.com:7443/v1',

  // Number of transactions each page has in balance tab notifications
  transactions_per_page: 50,

  // Configure bridges
  bridge: {
    // Outbound bridges
    out: {
      // Bitcoin outbound bridge
      // bitcoin: 'snapswap.us'
      'bitcoin': 'btc2ripple.com'
    }
  },

  mixpanel: {
    'token': '',
    // Don't track events by default
    'track': false
  },

  // production
  // activate_link: 'http://rippletrade.com/#/register/activate',
  // staging
  activate_link: 'http://staging.ripple.com/client/#/register/activate',

  b2rAddress: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
  snapswapApi: 'https://snapswap.us/api/v1',

  // Number of ledgers ahead of the current ledger index where a tx is valid
  tx_last_ledger: 3,

  // Set max transaction fee for network in drops of XRP
  max_tx_network_fee: 200000,

  // Set max number of rows for orderbook
  orderbook_max_rows: 20,

  // Show transaction confirmation page
  confirmation: {
    send: true,
    exchange: true,
    trade: true
  },

  // Show advanced parameters in the trust/gateway page
  advanced_feature_switch: false,

  // Default gateway max trust amount under 'simplfied' view ie when advanced_feature_switch is false in trust/gateway page
  gateway_max_limit: 1000000000,

  // Default threshold in XRPs for fee on RT to show higher load status
  low_load_threshold: 0.012,

  // Ripple trade backend URL
  backend_url: 'https://backend.rippletrade.com',
  ids_url: 'https://id.ripple.com',

  // Gateways that need to receive the sender information on withdrawals
  travel_rule: [
    'rsYnSWfvcJPpKC1QwDfdLixdk8VNQpAUv5',
    'rHoUTGMxWKbrTTF8tpAjysjpu8PWrbt1Wx',
    'rfDBg2CNqJApuzqJVPmBB2xrpvCJThPQ9P',
    'rZQGU7Y5ZdLhNWTCV6BKJFcpLijyYVYWX',
    'rpoMXA4vtj94J7W5EyR4Ev3gT7cBMAUGft',
    'rG6FZ31hDHN1K5Dkbma3PSB5uVCuVVRzfn',
    'rGFuMiw48HdbnrUbkRYuitXTmfrDBNTCnX',
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
    'rrpNnNLKrartuEqfJGpqyDwPj1AFPg9vn1',
    'rM3CxdfWgPqjFe6fta7bYTNmTcvfYoXQpC',
    'rMgFQ3a5UAgaXW25JKGpXoiZXSfhcmgT4p',
    'raBDVR7JFq3Yho2jf7mcx36sjTwpRJJrGU',
    'rpoMXA4vtj94J7W5EyR4Ev3gT7cBMAUGft',
    'rGre5XC7LhPnGQKJDxHSMNdhMNzwiMbeiY',
    'rDihBcUrrfDwUBZWBcuP2z5n47KVLQFNQH',
    'rngDdgcC2ZFr1kpJecv8BqqyrKpypAi2gg',
    'rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc',
    'rwgR9gg18KgtGnDVZ4jDoukQ6y16isPixN',
    'rGpzX9RFLehS1N1NnwBC1o4eBfjpNqUuuV',
    'rUFcQnmGYEuvJVJnZy8QBc9ouKJbpvK7QU',
    'r3gHXhK1pwZFG9ESiaosxjufEVQjwGuJUd',
    'rJRi8WW24gt9X85PHAxfWNPCizMMhqUQwg',
    'rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX',
    'rMpPEZcKYjYyfTyesrYWi5VV6wcy5mTxP1',
    'rUtr6h1XYbm1zTdVdN8Sisn95YMQS8Mdz5',
    'rhAkemed7gsh8jj1rfoxrTYBvaVnrXh7cw',
    'rGYgTjhfSfRvHbAbtS9ZramWmotcEeno84',
    'rDWiZqznju5jNTgAUEMB9zjnf7sNLZ9Djv',
    'rM8199qFwspxiWNZRChZdZbGN5WrCepVP1',
    'rhagG9NY2QnWuoJsH5Ktvejiv9gKmnfeXg',
    'rPxU6acYni7FcXzPCMeaPSwKcuS2GTtNVN',
    'rN2kfPAKSwMa7G6heuVSh4x2ivM4tKELsZ',
    'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
    'rhotcWYdfn6qxhVMbPKGDF3XCKqwXar5J4',
    'rrh7rf1gV2pXAoqA8oYbpHd8TKv5ZQeo67',
    'rP2jdgJhtY1pwDJQEMLfCixesg4cw8HcrW',
    'ruazs5h1qEsqpke88pcqnaseXdm6od2xc',
    'rGDWKWni6exeneJdNbEZ3nVX3Rrw5VG1p1',
    'rMUVZiUKrcZNqfpgNJRqQjpatGCPZSdrB8',
    'rEAo8FFqTDKZ3UhMBERx5yXqxWCo78Qzwg',
    'rvZLMdEKeX24FbLy5JzZAf26u252iM5JE',
    'rUrgNM8UvqGXPFVynxSsvKKAATFtqJGZSw',
    'r4H3F9dDaYPFwbrUsusvNAHLz2sEZk4wE5',
    'rLpKwneVStAVwPhgCgNJVFCePq5J3xaNpN',
    'rG6Fzwkovcg8dFiQ97fhujcbgPy1D3qyjh',
    'rnSvzcpQLf4nQrwLYaUQMovmGvszbS8dcD',
    'rJHygWcTLVpSXkowott6kzgZU6viQSVYM1',
    'rJfpbkyUyhW57zP3kqLFzX1PM8Tg8rfdAW',
    'rP9gFJKqKGWdR4n6XjdsUPqmJfXkg4kSgZ',
    'rpDMez6pm6dBve2TJsmDpv7Yae6V5Pyvy2',
    'rGh84RRDX4q6udARHpAA6Mq1v4rXqnzhRF',
    'r98EcmKKuLxtMDEJNK9YdnJKNrsg6ogcVv',
    'rh5sJ4ejSvyXGki5bgMJ7uzH1LpGqB3vGE',
    'rniJEA7wXG6QP4RAU5uFoLpp9mZ1W6FJJL',
    'rB3gZey7VWHYRqJHLoHDEJXJ2pEPNieKiS',
    'ra9eZxMbJrUcgV8ui7aPc161FgrqWScQxV',
    'rK2xHayb8YutoZD5TWCrHCiAqKwYXk2Ttg',
    'rPKSvQ1qFAksr7hzk2wC2xtqSqFbxP3wvg',
    'rn5Ttyhd89VEQMeVhuSeAEJg41UH8zGHxa',
    'rP2PAbh8mCHxHVmi4329ha6DbZjb1fUcd2',
    'rp2PaYDxVwDvaZVLEQv7bHhoFQEyX1mEx7',
    'rBadiLisPCyqeyRA1ufVLv5qgVRenP2Zyc',
    'rUkMKjQitpgAM5WTGk79xpjT38DEJY283d',
    'rhLSigWL4J9JBBW1JFMBvaduDkVghG7cc2',
    'r98VHQsrgByNxreLfRWvLjbd6bPcuoh5xY',
    'rp7NAJtFnC5Kqk7k6i3mWy9aSnbf9Bkyor',
    'rHr8CsFu3rZ4fNHfH8X74NZsSso1K7wxfA',
    'rsKT73WRDiPZBQ59YJqfEzDDj1n4mMAHsw',
    'rPBdpCM6s5cysNZPvnxazNmycYUdjoqXVz',
    'rNPRNzBB92BVpAhhZr4iXDTveCgV5Pofm9',
    'rMjTFFewweaqgNjUBLnGC2p9qA8UuEEGpj',
    'rfK9co7ypx6DJVDCpNyPr9yGKLNer5GRif',
    'rNFxMCoT4hRDVevjzkmnkxQvfVAS1epR7o',
    'rHcfNiEJ2nFaQPpSKLGKiTwPwHxEbvNZSB',
    'rLTSuhKSNaWvGHyRcnTSjms3iFew345SdG',
    'rGYYWKxT1XgNipUJouCq4cKiyAdq8xBoE9',
    'rfNZPxoZ5Uaamdp339U9dCLWz2T73nZJZH',
    'r37FUji17jCgCZvAUc8m5YqXquwHpgwa9q',
    'rUMzD7LmqHSKm9j6aSfxj1ojzdDgLvDxXf',
    'rs1jenWbPjUwuL17JmsNniNBFQvMzHgnik',
    'rM1JztoSdHmX2EPnRGRYmKQvkxZ2hnrWsn',
    'rB1ggHi4fMhXpMYWcjBpLUJGFDTz7j5QZn',
    'r45dBj4S3VvMMYXxr9vHX4Z4Ma6ifPMCkK',
    'razqQKzJRdB4UxFPWf5NEpEG3WMkmwgcXA',
    'rBXJpRvUWcjY9fQHZAFnENucuiWnqwrvqF',
    'rPieu9a36xxhxFzMGoDtaLHHE17yVcn718',
    'rJLLkgybuGPxod8WFoNgiHH8BzLiZRHCjp',
    'r9ZFPSb1TFdnJwbTMYHvVwFK1bQPUCVNfJ',
    'rLSnkKvMfPD9abLoQFxQJMYyZqJcsqkL3o',
    'rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y',
    'rpWKyqptwSMyexGitY1ukR2Y4rbpzassQR',
    'r3G1JyRpwMsVaY21QkwE9g3zVuLonWL3qR',
    'rPcQaiyDxMwLr7Q9eFmn5VnVx2RN57MUmN',
    'rPFLkxQk6xUGdGYEykqe7PR25Gr7mLHDc8',
    'r3ipidkRUZWq8JYVjnSnNMf3v7o69vgLEW',
    'rGbTxaYffyfeYjMaWDbcAc28heb9JRpMoW',
    'rDBpF8BGQDpBfJQhQ43SMRhNE2THMZc9x2',
    'raoFdQah8c8owTj4TPMr8o1WntnXybXCgB',
    'rP5ShE8dGBH6hHtNvRESdMceen36XFBQmh',
    'rwdRX4jgRB5rZkbbbG7ezVTBKdBNKVrtpR',
    'rkH1aQbL2ajA7HUsx8VQRuL3VaEByHELm',
    'rqxr9wPdZ9rvKhStCp2tWjy7N5BonXvgJ',
    'rUSrgqXVFEw5ZaruTqiDrXDecRuGnhFqu8',
    'r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH',
    'rL4A1qbTkrJXT644gyzmLVk6uudyMagJ9Q',
    'r3bStftDydy4dKEUBc9YMabTTk98uZzMpF',
    'rsiZR2t24SX69XxLNNwArqVn5nJyHyFemk',
    'rMAz5ZnK73nyNUL4foAvaxdreczCkG3vA6',
    'rPaHj18h1vPTfrVJ55yp4KcXKPB8WiRVJu',
    'rDski2QnDTrpzyQye6RGjjCjZX84yTSrWU',
    'r3ADD8kXSUKHd6zTCKfnKT3zV9EZHjzp1S',
    'rnuF96W4SZoCJmbHYBFoJZpR8eCaxNvekK',
    'r45dBj4S3VvMMYXxr9vHX4Z4Ma6ifPMCkK',
    'rno91tGDJeRcnM7EMXj8KG9UTyxRGMMz8s',
    'rHiqXXVXNK85UJH7oEB4D81TJhwbH8vyrk',
    'rajgeXpN88PNquRcaBXKH7uuVsPMq7aP47',
    'rNaptDNfFXo1quhKwMaNPf66iwPqA8YLky',
    'rLY756emTwXHdTaT5Lwrjv4zgy6gfQ84xz',
    'rnmZNZokG9bMJNsiL3YWSmLXmme1K45Vmt',
    'rE7CNMbxwvTQrqSEjbcXCrqeN6EZga1ApU',
    'rJFaiR1iH74kPw2Lb3sDktuyXGZiij674Z',
    'r9oVjcL7d87V2vEvu8s12nhc7VJJ8Baipx',
    'rEKbakXJMo4Cnb7WJekVW38mANAMXajAXi',
    'rBX2p3s87s1HgMPz2nKWBwDdJFogNcfQGK',
    'ra98sfbmYvVF9AQWKS3sjDBBNwQE85k2pE',
    'rUR5QVHqFxRa8TSQawc1M6jKj7BvKzbHek',
    'rBycsjqxD8RVZP5zrrndiVtJwht7Z457A8',
    'rnqmcGPKJDaHqpKP9HPPn4SrZWkUcLkLEc',
    'rJypGvB8H2JBj1QVYofUTU8kFtWLspNWqs',
    'rUZbgiS4XDBwCM88xwhRdGGioVMhH94nSE',
    'rUBLCjWdsPPMkppdFXVJWhHnr3FNqCzgG3',
    'rNGwmUA1oNK35frqavJwkhbLS1Ubcua828',
    'rEjtM7pApzYS3KyTWndkiUx5wX83Zdy9gd',
    'rMdq2LLTJGHxt22v3CQLucJbPsC3Jra3Ba',
    'rUQTpMqAF5jhykj4FExVeXakrZpiKF6cQV',
    'rsTQ7iwrCik9Ugc3zbpcbo2K3SbAdYJss1',
    'rnd8KJ4qeip6FPJvC1fyv82nW2Lm8C8KjQ',
    'r5ymZSvtdNgbKVc8ay1Jhmq5f9QgnvEtj',
    'r4QTSDGSx1t5m7pqqf9m8SzrGx4MUDJkYE',
    'rGNWXZ2ucXoSRx2Q16h1P75ZXx9rbNFQWi',
    'rDYje9etDJoZnAz9KbXH8pU6Zja7NAqzYw',
    'r46JpeCDhNCjUvpHGuJK5AC5iXTz2mC1vq',
    'rEk9i7G8ac1kUs1mFjtze1qjj9FzGvXAG',
    'rQsAshmCjPsxkYnxY9GnmBTAeEUaePDAie',
    'rJEGoKXPMeEbHS3TUhdwP1Qygq1DWFgZv3',
    'ra7JkEzrgeKHdzKgo4EUUVBnxggY4z37kt',
    'rUeXUxaMTH1pELvD2EkiHTRcM9FsH3v4d7',
    'rLHWqjEApyXD57m4HRj77sjoVeHPJgUPw9',
    'ra8tWeGqtt7UX8JVFv9LbGA97HxfuxU433',
    'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
    'rHX1LbfbrtsMsEWCc5AGyQx6nRnTN1VpSN',
    'rwm98fCBS8tV1YB8CGho8zUPW5J7N41th2',
    'rBRVqcXrm1YAbanngTxDfH15LNb6TjNmxk',
    'rGvWKKaVboTqY6GwP7afhDkYZ5qQMTvora',
    'rfjiQeJMp1eNfbso3F26a7JWe3JuicZirg',
    'rUeFPRGNjtcbtezyQKKiDcS1eQyYLQ1gcr',
    'rLEsXccBGNR3UPuPu2hUXPjziKC3qKSBun',
    'r94s8px6kSw1uZ1MV98dhSRTvc6VMPoPcN',
    'rHENTPe3nMDLGJd59e5a3tYH9BXz1nFhvA',
    'rH3bZsvVUhzugvcYuJVoSYCEMHkfK6wHNv',
    'rswMmWpTbRHSZiiWSxz1ttjTggGU1B8MQv',
    'rh9ANkiaAyCjoCrqxDzu8p56aLfsWwgypx',
    'rHZP1pA3THovFqvwgtM2tnJWrS54hSrDiG',
    'r3THXKcb5KnJbD5M74kRdMfpoMY1ik8dQ5',
    'rBcYpuDT1aXNo4jnqczWJTytKGdBGufsre',
    'rpvfJ4mR6QQAeogpXEKnuyGBx8mYCSnYZi',
    'r9vbV3EHvXWjSkeQ6CAcYVPGeq7TuiXY2X',
    'r47RkFi1Ew3LvCNKT6ufw3ZCyj5AJiLHi9',
    'r9NkxojygdupNWz6Bnj9J5HagXzxfoxRiE',
    'r9xAQUyqs53QH2PLxe7iFbNbpU2RA9QtZx',
    'rPDXxSZcuVL3ZWoyU82bcde3zwvmShkRyF',
    'rwPy6FD7LoTgEcy9Sd9bm3HE7uU5LDCf2H',
    'rskyRgUc5g4jvyMemMS77Fk8cLbAKH3GTf',
    'rLZXimQSf7JYfwJACN2682eghspfzdX35E',
    'rBjnY8o9aNCvPi7Mi4jbXGCjxDj8ZD2cPL',
    'rpbHacBcjQSNoJ9kE92JtgF1VRCfxBQyjJ',
    'r4zRhH45HJehJSa75HyY8jZLWbEGRJ3Qzn',
    'r4hZtWkSW8EbeFG5QXqB7ohohkrZg8zLQ8',
    'rs4mVFV97Um5T6DcK7q3ZXg11ULm6ZD9Ed',
    'rfqj6xcqdoKNLyjHrnKzvBdkviBXoxeSM2',
    'rLsqugnKWVvEfRdthiFCeZCAUZ2mXYfnYb',
    'rKYNhsT3aLymkGH7WL7ZUHkm6RE27iuM4C',
    'rExAPEZvbkZqYPuNcZ7XEBLENEshsWDQc8',
    'rGvYA1nrdbRrbieuDg4FzmQ1Ptem4fKXrn',
    'rsVvunz9S2RfcwoX7XRFEuigFa7tijsKqb',
    'r9KFser4fcH2M7fwKJCuGtFzR8PTfLhyE9',
    'rEUNavLM2NPpLW8dKqk3BRhXcZk5Hv7dhj',
    'rfLkDwAEQSpTvShmSLLSGWhMmEk65Va1jR'
  ]
};

// Load client-side overrides
if (store.enabled) {
  var settings = JSON.parse(store.get('ripple_settings') || '{}');

  if (settings.server && settings.server.servers) {
    Options.server.servers = settings.server.servers;
  }

  if (settings.bridge) {
    Options.bridge.out.bitcoin = settings.bridge.out.bitcoin.replace('https://www.bitstamp.net/ripple/bridge/out/bitcoin/', 'snapswap.us');
  }

  if (settings.blobvault) {
    // TODO: test if url defined and valid
    Options.blobvault = settings.blobvault.replace('payward.com', 'ripple.com');
  }

  if (settings.mixpanel) {
    Options.mixpanel = settings.mixpanel;
  }

  if (settings.max_tx_network_fee) {
    Options.max_tx_network_fee = settings.max_tx_network_fee;
  }

  Options.server.servers = Options.server.servers.map(function (server) {
    server.host = server.host.replace(/s_(west|east)/, 's-$1');
    return server;
  });
}
