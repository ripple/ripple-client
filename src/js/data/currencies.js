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
  {value: 'XRP', name: 'Ripples', order: 5},
  {value: 'USD', name: 'US Dollar', order: 4},
  {value: 'EUR', name: 'Euro', order: 3},
  {value: 'BTC', name: 'Bitcoin', order: 2},
  {value: 'LTC', name: 'Litecoin', order: 1},
  {value: 'JPY', name: 'Japanese Yen', order: 0},
  {value: 'CNY', name: 'Chinese Yuan', order: 0},
  {value: 'INR', name: 'Indian Rupee', order: 0},
  {value: 'RUB', name: 'Russian Ruble', order: 0},
  {value: 'GBP', name: 'British Pound', order: 0},
  {value: 'CAD', name: 'Canadian Dollar', order: 0},
  {value: 'BRL', name: 'Brazilian Real', order: 0},
  {value: 'CHF', name: 'Swiss Franc', order: 0},
  {value: 'DKK', name: 'Danish Krone', order: 0},
  {value: 'NOK', name: 'Norwegian Krone', order: 0},
  {value: 'SEK', name: 'Swedish Krona', order: 0},
  {value: 'CZK', name: 'Czech Koruna', order: 0},
  {value: 'PLN', name: 'Polish Zloty', order: 0},
  {value: 'AUD', name: 'Australian Dollar', order: 0},
  {value: 'MXN', name: 'Mexican Peso', order: 0},
  {value: 'KRW', name: 'South Korean Won', order: 0},
  {value: 'TWD', name: 'New Taiwan Dollar', order: 0},
  {value: 'HKD', name: 'Hong Kong Dollar', order: 0},
  {value: 'KES', name: 'Kenyan Shilling', order: 0},
  {value: 'AMD', name: 'Armenian Drams', order: 0},
  {value: 'RUR', name: 'Russian Rubles', order: 0},
  {value: 'RON', name: 'Romanian Leu', order: 0},
  {value: 'NZD', name: 'New Zealand Dollar', order: 0},
  {value: 'TRY', name: 'Turkish Lira', order: 0},
  {value: 'XAU', name: 'Gold', order: 0},
  {value: 'XAG', name: 'Silver', order: 0},
  {value: 'XPT', name: 'Platinum', order: 0}
];
