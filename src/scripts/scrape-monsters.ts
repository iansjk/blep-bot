import cheerio from 'cheerio';
import fs from 'fs';
import got from 'got';
import type { Hitzone } from '../types/hitzone';
import type { Monster } from '../types/monster';

const KIRANICO_BASE_URL = 'https://mhworld.kiranico.com';
const monsterListUrl = `${KIRANICO_BASE_URL}/monsters`;
const monsters = new Map<string, Monster>();
let $: CheerioStatic;
const hitzones: Hitzone[] = [];

function matchKinsectPartToMonsterPart(
  monster: Monster, monsterPartNames: Set<string>, kinsectPartName: string,
): string {
  return kinsectPartName; // TODO
}

function trToStrings(elem: CheerioElement): string[] {
  const $tr = $(elem);
  const $tds = $tr.find('td').map((__, tdNode) => $(tdNode).text().trim());
  // calling text() on CheerioElement[] and then toArray() results in string[];
  // typedef seems to be incorrect
  return $tds.toArray() as unknown as string[];
}

async function getHitzonesForMonster(monster: Monster): Promise<Hitzone[]> {
  const partNames = new Set<string>();
  const monsterHitzones: Hitzone[] = [];
  $ = cheerio.load((await got(monster.url)).body);
  const $hitzoneTrs = $('h6:contains("Physiology")').siblings().find('table tbody tr');
  $hitzoneTrs.each((_, elem) => {
  // table row column order:
  // part name, sever, blunt, shot, fire, water, thunder, ice, dragon, stun
    const tdTexts = trToStrings(elem);
    const part = tdTexts[0];
    partNames.add(part);
    const [sever, blunt, shot, fire, water, thunder, ice, dragon, stun] = tdTexts.slice(1)
      .map((elem2) => parseInt(elem2, 10));
    const hzNoExtract: Hitzone = {
      monster, part, sever, blunt, shot, fire, water, thunder, ice, dragon, stun,
    };
    if ($(elem).find('img[src*="ib_icon"]').length > 0) {
    // the <img src="...ib_icon.png"> indicates that a part has different HZVs in IB.
    // replace the previous entry rather than pushing a new one in this case
      const baseWorldHzvIndex = monsterHitzones.findIndex((hz) => hz.part === part);
      monsterHitzones[baseWorldHzvIndex] = hzNoExtract;
    } else {
      monsterHitzones.push(hzNoExtract);
    }
  });

  // add kinsect extract information
  const $kinsectTrs = $('h6:contains("Part Breakability")').siblings().find('table tbody tr');
  $kinsectTrs.each((_, elem) => {
  // part name, break value, sever value, extract color
    const [kinsectPartName, _breakValue, _severValue, extract] = trToStrings(elem);
    const monsterPartMatch = matchKinsectPartToMonsterPart(monster, partNames, kinsectPartName);
    monsterHitzones
      .filter((hz) => hz.part === monsterPartMatch)
      .forEach((hz) => { hz.extract = extract; });
  });
  return monsterHitzones;
}

(async () => {
  $ = cheerio.load((await got(monsterListUrl)).body);
  const $anchors = $('h6:contains("Large Monsters")').siblings().find('tbody td:first-child a');
  $anchors.each((_, aElem) => {
    const $a = $(aElem);
    const name = $a.text().trim();
    const href = $a.attr('href');
    monsters.set(href, { name, url: href });
  });

  await Promise.all([...monsters.values()].map(async (monster) => {
    const monsterHitzones = await getHitzonesForMonster(monster);
    Array.prototype.push.apply(hitzones, monsterHitzones);
  }));
  fs.writeFileSync('hitzones.json', JSON.stringify(hitzones, null, 2));
})();
