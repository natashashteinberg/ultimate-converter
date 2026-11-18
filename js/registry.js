import ustax from './modules/ustax.js';
import units from './modules/units.js';
import temperature from './modules/temperature.js';
import time from './modules/time.js';
import currencies from './modules/currencies.js';
import vat from './modules/vat.js';
import percent from './modules/percent.js';
import discounts from './modules/discounts.js';
import cardcost from './modules/cardcost.js';
import tip from './modules/tip.js';
import dates from './modules/dates.js';
import timezones from './modules/timezones.js';
import fuel from './modules/fuel.js';
import unitprice from './modules/unitprice.js';
import sizes from './modules/sizes.js';
import kitchen from './modules/kitchen.js';
import shopsizes from './modules/shopsizes.js';

export const groups = [
  { id: 'convert', title: 'המרות' },
  { id: 'money', title: 'חישובי כסף' },
  { id: 'travel', title: 'נסיעות וקניות' },
];

export const tools = [ustax, units, temperature, time, currencies, sizes, kitchen, timezones, dates, vat, percent, discounts, tip, fuel, cardcost, unitprice, shopsizes];
