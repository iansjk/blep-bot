import Handlebars from 'handlebars';
import { rawHzvHelper, eleHzvHelper, stunHzvHelper } from './mhw';

describe('rawHzvHelper', () => {
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

describe('eleHzvHelper', () => {
  it('colors elemental hitzone values correctly', () => {
    const breakpoints = [5, 10, 15, 20, 25, 30];
    const elements = ['fire', 'water', 'thunder', 'ice', 'dragon'];
    breakpoints.forEach((breakpoint) => {
      elements.forEach((element) => {
        if (breakpoint >= 25) {
          expect(eleHzvHelper(`${breakpoint}`, element)).toStrictEqual(
            new Handlebars.SafeString(`<td class="${element}-${breakpoint}"><span class="white">${breakpoint}</span></td>`),
          );
        } else {
          expect(eleHzvHelper(`${breakpoint}`, element)).toStrictEqual(
            new Handlebars.SafeString(`<td class="${element}-${breakpoint}">${breakpoint}</td>`),
          );
        }
      });
    });
  });

  it('returns "-" for 0 hitzone values', () => {
    expect(eleHzvHelper('0', 'fire')).toStrictEqual(
      new Handlebars.SafeString('<td>-</td>'),
    );
  });
});

describe('stunHzvHelper', () => {
  it('returns a number', () => {
    expect(stunHzvHelper('120')).toStrictEqual(120);
    expect(stunHzvHelper('100')).toStrictEqual(100);
  });

  it('returns "-" for 0', () => {
    expect(stunHzvHelper('0')).toStrictEqual('-');
  });
});
