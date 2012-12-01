/**
 * Ripple default external currency list.
 *
 * These currencies are ranked by value of notes in circulation. Source:
 *
 * * http://goldnews.bullionvault.com/all_the_money_in_the_world_102720093
 *   (A better source is welcome. Note: The US dollar was moved to the top.)
 *
 * Important: XRP must be the first entry in this list.
 */
module.exports = [
  {value: 'XRP', name: 'XRP - Ripples'},
  {value: 'USD', name: 'USD - US Dollar'},
  {value: 'EUR', name: 'EUR - Euro'},
  {value: 'BTC', name: 'BTC - Bitcoin'},
  {value: 'JPY', name: 'JPY - Japanese Yen'},
  {value: 'CNY', name: 'CNY - Chinese Yuan'},
  {value: 'INR', name: 'INR - Indian Rupee'},
  {value: 'RUB', name: 'RUB - Russian Ruble'},
  {value: 'GBP', name: 'GBP - British Pound'},
  {value: 'CAD', name: 'CAD - Canadian Dollar'},
  {value: 'BRL', name: 'BRL - Brazilian Real'},
  {value: 'CHF', name: 'CHF - Swiss Franc'},
  {value: 'PLN', name: 'PLN - Polish Zloty'},
  {value: 'AUD', name: 'AUD - Australian Dollar'},
  {value: 'MXN', name: 'MXN - Mexican Peso'},
  {value: 'KRW', name: 'KRW - South Korean Won'},
  {value: 'TWD', name: 'TWD - New Taiwan Dollar'},
  {value: 'HKD', name: 'HKD - Hong Kong Dollar'}
];
