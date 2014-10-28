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
  {value: 'XRP', short_value: 'XRP', name: 'Ripple', standard_precision: 4, order: 5},
  {value: 'USD', short_value: 'USD', name: 'US Dollar', standard_precision: 2, order: 4},
  {value: 'EUR', short_value: 'EUR', name: 'Euro', standard_precision: 2, order: 3},
  {value: 'BTC', short_value: 'BTC', name: 'Bitcoin', standard_precision: 4, order: 2},
  {value: 'LTC', short_value: 'LTC', name: 'Litecoin', standard_precision: 4, order: 1},
  {value: 'JPY', short_value: 'JPY', name: 'Japanese Yen', standard_precision: 2, order: 0},
  {value: 'CNY', short_value: 'CNY', name: 'Chinese Yuan', standard_precision: 2, order: 0},
  {value: 'INR', short_value: 'INR', name: 'Indian Rupee', standard_precision: 2, order: 0},
  {value: 'RUB', short_value: 'RUB', name: 'Russian Ruble', standard_precision: 2, order: 0},
  {value: 'GBP', short_value: 'GBP', name: 'British Pound', standard_precision: 2, order: 0},
  {value: 'CAD', short_value: 'CAD', name: 'Canadian Dollar', standard_precision: 2, order: 0},
  {value: 'BRL', short_value: 'BRL', name: 'Brazilian Real', standard_precision: 2, order: 0},
  {value: 'CHF', short_value: 'CHF', name: 'Swiss Franc', standard_precision: 2, order: 0},
  {value: 'DKK', short_value: 'DKK', name: 'Danish Krone', standard_precision: 2, order: 0},
  {value: 'NOK', short_value: 'NOK', name: 'Norwegian Krone', standard_precision: 2, order: 0},
  {value: 'SEK', short_value: 'SEK', name: 'Swedish Krona', standard_precision: 2, order: 0},
  {value: 'CZK', short_value: 'CZK', name: 'Czech Koruna', standard_precision: 2, order: 0},
  {value: 'PLN', short_value: 'PLN', name: 'Polish Zloty', standard_precision: 2, order: 0},
  {value: 'AUD', short_value: 'AUD', name: 'Australian Dollar', standard_precision: 2, order: 0},
  {value: 'MXN', short_value: 'MXN', name: 'Mexican Peso', standard_precision: 2, order: 0},
  {value: 'KRW', short_value: 'KRW', name: 'South Korean Won', standard_precision: 2, order: 0},
  {value: 'TWD', short_value: 'TWD', name: 'New Taiwan Dollar', standard_precision: 2, order: 0},
  {value: 'HKD', short_value: 'HKD', name: 'Hong Kong Dollar', standard_precision: 2, order: 0},
  {value: 'KES', short_value: 'KES', name: 'Kenyan Shilling', standard_precision: 2, order: 0},
  {value: 'AMD', short_value: 'AMD', name: 'Armenian Drams', standard_precision: 2, order: 0},
  {value: 'RUR', short_value: 'RUR', name: 'Russian Rubles', standard_precision: 2, order: 0},
  {value: 'RON', short_value: 'RON', name: 'Romanian Leu', standard_precision: 2, order: 0},
  {value: 'NZD', short_value: 'NZD', name: 'New Zealand Dollar', standard_precision: 2, order: 0},
  {value: 'TRY', short_value: 'TRY', name: 'Turkish Lira', standard_precision: 2, order: 0},
  {value: 'XAU', short_value: 'XAU', name: 'Gold', standard_precision: 2, order: 0},
  {value: 'XAU(-0.05%pa)', short_value: 'XAU.gbi', name: 'GBI Gold', standard_precision: 2, order: 0},
  {value: 'XAG', short_value: 'XAG', name: 'Silver', standard_precision: 2, order: 0},
  {value: 'XPT', short_value: 'XPT', name: 'Platinum', standard_precision: 2, order: 0}
];
