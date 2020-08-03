import Handlebars from 'handlebars';
import { rawHzvHelper } from './mhw';

describe('MHW hitzones command', () => {
  it('formats raw hzvs', () => {
    expect(rawHzvHelper('20', 'totally real monster')).toStrictEqual(new Handlebars.SafeString('20 &rarr; 40'));
  });

  it('calculates offsets correctly for +30 monsters', () => {
    const monstersWith30Offset = [
      'Kirin',
      'Lavasioth',
      'Uragaan',
      'Savage Deviljho',
      'Namielle',
      'Gold Rathian',
      'Silver Rathalos',
    ];
    monstersWith30Offset.forEach((monsterName) => {
      expect(rawHzvHelper('10', monsterName)).toStrictEqual(new Handlebars.SafeString('10 &rarr; 37'));
    });
  });

  it('calculates offset correctly for Safi (+20)', () => {
    expect(rawHzvHelper('20', "Safi'jiiva")).toStrictEqual(new Handlebars.SafeString('20 &rarr; 35'));
  });

  it('bolds wexable hitzones', () => {
    expect(rawHzvHelper('45', 'totally real monster')).toStrictEqual(new Handlebars.SafeString('<b>45</b> &rarr; <b>58</b>'));
  });
});
