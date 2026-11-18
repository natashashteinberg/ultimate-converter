import { mountSimpleConverter } from '../simpleConverter.js';

export default {
  id: 'temperature',
  title: 'טמפרטורה',
  group: 'convert',
  icon: 'thermometer',
  render(container) {
    mountSimpleConverter(container, {
      category: 'temperature',
      defaults: ['f', 'c'],
      title: 'המרת טמפרטורה',
      help: 'בין פרנהייט (כמו בארה"ב), צלזיוס וקלווין. למשל: 350 פרנהייט הם 177 צלזיוס.',
      placeholder: 'למשל 350',
      storeKey: 'temp_last',
      digits: 2,
    });
  },
};
