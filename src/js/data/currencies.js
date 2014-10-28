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
  {val: 'XRP', short_val: 'XRP', name: 'Ripple', standard_precision: 4, order: 5},
  {val: 'USD', short_val: 'USD', name: 'US Dollar', standard_precision: 2, order: 4},
  {val: 'EUR', short_val: 'EUR', name: 'Euro', standard_precision: 2, order: 3},
  {val: 'BTC', short_val: 'BTC', name: 'Bitcoin', standard_precision: 4, order: 2},
  {val: 'LTC', short_val: 'LTC', name: 'Litecoin', standard_precision: 4, order: 1},
  {val: 'JPY', short_val: 'JPY', name: 'Japanese Yen', standard_precision: 2, order: 0},
  {val: 'CNY', short_val: 'CNY', name: 'Chinese Yuan', standard_precision: 2, order: 0},
  {val: 'INR', short_val: 'INR', name: 'Indian Rupee', standard_precision: 2, order: 0},
  {val: 'RUB', short_val: 'RUB', name: 'Russian Ruble', standard_precision: 2, order: 0},
  {val: 'GBP', short_val: 'GBP', name: 'British Pound', standard_precision: 2, order: 0},
  {val: 'CAD', short_val: 'CAD', name: 'Canadian Dollar', standard_precision: 2, order: 0},
  {val: 'BRL', short_val: 'BRL', name: 'Brazilian Real', standard_precision: 2, order: 0},
  {val: 'CHF', short_val: 'CHF', name: 'Swiss Franc', standard_precision: 2, order: 0},
  {val: 'DKK', short_val: 'DKK', name: 'Danish Krone', standard_precision: 2, order: 0},
  {val: 'NOK', short_val: 'NOK', name: 'Norwegian Krone', standard_precision: 2, order: 0},
  {val: 'SEK', short_val: 'SEK', name: 'Swedish Krona', standard_precision: 2, order: 0},
  {val: 'CZK', short_val: 'CZK', name: 'Czech Koruna', standard_precision: 2, order: 0},
  {val: 'PLN', short_val: 'PLN', name: 'Polish Zloty', standard_precision: 2, order: 0},
  {val: 'AUD', short_val: 'AUD', name: 'Australian Dollar', standard_precision: 2, order: 0},
  {val: 'MXN', short_val: 'MXN', name: 'Mexican Peso', standard_precision: 2, order: 0},
  {val: 'KRW', short_val: 'KRW', name: 'South Korean Won', standard_precision: 2, order: 0},
  {val: 'TWD', short_val: 'TWD', name: 'New Taiwan Dollar', standard_precision: 2, order: 0},
  {val: 'HKD', short_val: 'HKD', name: 'Hong Kong Dollar', standard_precision: 2, order: 0},
  {val: 'KES', short_val: 'KES', name: 'Kenyan Shilling', standard_precision: 2, order: 0},
  {val: 'AMD', short_val: 'AMD', name: 'Armenian Drams', standard_precision: 2, order: 0},
  {val: 'RUR', short_val: 'RUR', name: 'Russian Rubles', standard_precision: 2, order: 0},
  {val: 'RON', short_val: 'RON', name: 'Romanian Leu', standard_precision: 2, order: 0},
  {val: 'NZD', short_val: 'NZD', name: 'New Zealand Dollar', standard_precision: 2, order: 0},
  {val: 'TRY', short_val: 'TRY', name: 'Turkish Lira', standard_precision: 2, order: 0},
  {val: 'XAU', short_val: 'XAU', name: 'Gold', standard_precision: 2, order: 0},
  {val: 'XAU(-0.05%pa)', short_val: 'XAU.gbi', name: 'GBI Gold', standard_precision: 2, order: 0},
  {val: 'XAG', short_val: 'XAG', name: 'Silver', standard_precision: 2, order: 0},
  {val: 'XPT', short_val: 'XPT', name: 'Platinum', standard_precision: 2, order: 0}
];
