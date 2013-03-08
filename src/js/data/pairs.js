/**
 * Ripple trading default currency pairs.
 *
 * This list is a bit arbitrary, but it's basically the Majors [1] from forex
 * trading with some XRP pairs added.
 *
 * [1] http://en.wikipedia.org/wiki/Currency_pair#The_Majors
 */
module.exports = [
  {name: 'BTC/XRP', order: 10},
  {name: 'USD/XRP', order: 9},
  {name: 'EUR/XRP', order: 8},
  {name: 'JPY/XRP', order: 7},
  {name: 'GBP/XRP', order: 6},
  {name: 'AUD/XRP', order: 5},
  {name: 'CHF/XRP', order: 4},
  {name: 'CAD/XRP', order: 3},
  {name: 'BTC/USD', order: 2},
  {name: 'BTC/EUR', order: 1},
  {name: 'EUR/USD', order: 0},
  {name: 'USD/JPY', order: 0},
  {name: 'GBP/USD', order: 0},
  {name: 'AUD/USD', order: 0},
  {name: 'USD/CHF', order: 0}
];
