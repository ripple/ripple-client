/**
 * Ripple trading default currency pairs.
 *
 * This list is a bit arbitrary, but it's basically the Majors [1] from forex
 * trading with some XRP pairs added.
 *
 * [1] http://en.wikipedia.org/wiki/Currency_pair#The_Majors
 */
module.exports = [
  {name: 'BTC/XRP', order: 1},
  {name: 'XRP/USD', order: 1},
  {name: 'XRP/EUR', order: 1},
  {name: 'XRP/JPY', order: 0},
  {name: 'XRP/GBP', order: 0},
  {name: 'XRP/AUD', order: 0},
  {name: 'XRP/CHF', order: 0},
  {name: 'XRP/CAD', order: 0},
  {name: 'XRP/CNY', order: 0},
  {name: 'BTC/USD', order: 0},
  {name: 'BTC/EUR', order: 0},
  {name: 'EUR/USD', order: 0},
  {name: 'USD/JPY', order: 0},
  {name: 'GBP/USD', order: 0},
  {name: 'AUD/USD', order: 0},
  {name: 'USD/CHF', order: 0}
];
