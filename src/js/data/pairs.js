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
  {name: 'USD/XRP', order: 1},
  {name: 'EUR/XRP', order: 1},
  {name: 'JPY/XRP', order: 0},
  {name: 'GBP/XRP', order: 0},
  {name: 'AUD/XRP', order: 0},
  {name: 'CHF/XRP', order: 0},
  {name: 'CAD/XRP', order: 0},
  {name: 'CNY/XRP', order: 0},
  {name: 'BTC/USD', order: 0},
  {name: 'BTC/EUR', order: 0},
  {name: 'EUR/USD', order: 0},
  {name: 'USD/JPY', order: 0},
  {name: 'GBP/USD', order: 0},
  {name: 'AUD/USD', order: 0},
  {name: 'USD/CHF', order: 0}
];
