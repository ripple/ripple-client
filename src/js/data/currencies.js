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
  {value: 'XRP', name: 'XRP - Ripples', order: 4},
  {value: 'USD', name: 'USD - US Dollar', order: 3},
  {value: 'EUR', name: 'EUR - Euro', order: 2},
  {value: 'BTC', name: 'BTC - Bitcoin', order: 1},
  {value: 'JPY', name: 'JPY - Japanese Yen', order: 0},
  {value: 'CNY', name: 'CNY - Chinese Yuan', order: 0},
  {value: 'INR', name: 'INR - Indian Rupee', order: 0},
  {value: 'RUB', name: 'RUB - Russian Ruble', order: 0},
  {value: 'GBP', name: 'GBP - British Pound', order: 0},
  {value: 'CAD', name: 'CAD - Canadian Dollar', order: 0},
  {value: 'BRL', name: 'BRL - Brazilian Real', order: 0},
  {value: 'CHF', name: 'CHF - Swiss Franc', order: 0},
  {value: 'DKK', name: 'DKK - Danish Krone', order: 0},
  {value: 'NOK', name: 'NOK - Norwegian Krone', order: 0},
  {value: 'SEK', name: 'SEK - Swedish Krona', order: 0},
  {value: 'PLN', name: 'PLN - Polish Zloty', order: 0},
  {value: 'AUD', name: 'AUD - Australian Dollar', order: 0},
  {value: 'MXN', name: 'MXN - Mexican Peso', order: 0},
  {value: 'KRW', name: 'KRW - South Korean Won', order: 0},
  {value: 'TWD', name: 'TWD - New Taiwan Dollar', order: 0},
  {value: 'HKD', name: 'HKD - Hong Kong Dollar', order: 0}
];
