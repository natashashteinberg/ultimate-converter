import { mountSimpleConverter } from '../simpleConverter.js';

export default {
  id: 'time',
  title: 'זמן',
  group: 'convert',
  icon: 'timer',
  render(container) {
    mountSimpleConverter(container, {
      category: 'time',
      defaults: ['h', 'min'],
      title: 'המרת יחידות זמן',
      help: 'בין שניות, דקות, שעות, ימים, שבועות, חודשים ושנים. למשל: 3 שעות הן 180 דקות.',
      note: 'חודש נחשב בממוצע ל-30.44 ימים, ושנה ל-365.25 ימים.',
      placeholder: 'למשל 3',
      storeKey: 'time_last',
    });
  },
};
