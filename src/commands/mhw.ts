import { Message } from 'discord.js';
import fs from 'fs';
import Fuse from 'fuse.js';
import Handlebars from 'handlebars';
import { Hitzone } from 'hitzone';
import { Collection } from 'mongodb';
import nodeHtmlToImage from 'node-html-to-image';
import path from 'path';
import slugify from 'slugify';
import { BlepBotClient, BlepBotCommand } from '../client/internal';
import { choose, error } from '../common';
import { Monster } from '../types/monster';

const EPSILON = 1e-10;
const FUSE_OPTIONS: Fuse.IFuseOptions<Monster> = {
  includeScore: true,
  shouldSort: true,
  keys: ['name'],
  threshold: 0.2,
};
const PNG_DIRECTORY = path.join(__dirname, '../data/hzvs');
const HANDLEBARS_TEMPLATE_FILEPATH = path.join(__dirname, 'template.handlebars');
const CLUTCH_CLAW_20_OFFSET_MONSTERS = new Set([
  "Safi'jiiva",
  'Fatalis'
]);
const CLUTCH_CLAW_30_OFFSET_MONSTERS = new Set([
  'Kirin',
  'Lavasioth',
  'Uragaan',
  'Savage Deviljho',
  'Namielle',
  'Gold Rathian',
  'Silver Rathalos',
]);

export function rawHzvHelper(hzvText: string, monsterName: string) {
  const value = parseInt(hzvText, 10);
  if (value === 0) {
    return '-';
  }
  let offset = 25;
  if (CLUTCH_CLAW_20_OFFSET_MONSTERS.has(monsterName)) {
    offset = 20;
  } else if (CLUTCH_CLAW_30_OFFSET_MONSTERS.has(monsterName)) {
    offset = 30;
  }
  const postTenderizeValue = Math.floor(value * 0.75 + offset);
  const formattedHzv = `${value >= 45 ? `<b>${value}</b>` : `${value}`} &rarr; ${postTenderizeValue >= 45 ? `<b>${postTenderizeValue}</b>` : `${postTenderizeValue}`}`;
  return new Handlebars.SafeString(formattedHzv);
}

export function eleHzvHelper(hzvText: string, element: string) {
  const value = parseInt(hzvText, 10);
  if (value === 0) {
    return new Handlebars.SafeString('<td>-</td>');
  }
  let innerClass;
  let outerClass;
  if (value >= 30) {
    outerClass = `${element}-30`;
    innerClass = 'white';
  } else if (value >= 25) {
    outerClass = `${element}-25`;
    innerClass = 'white';
  } else if (value >= 20) {
    outerClass = `${element}-20`;
  } else if (value >= 15) {
    outerClass = `${element}-15`;
  } else if (value >= 10) {
    outerClass = `${element}-10`;
  } else if (value >= 5) {
    outerClass = `${element}-5`;
  }
  let toReturn = `<td${outerClass ? ` class="${outerClass}"` : ''}>`;
  if (innerClass) {
    toReturn += `<span class="${innerClass}">${value}</span>`;
  } else {
    toReturn += value;
  }
  toReturn += '</td>';
  return new Handlebars.SafeString(toReturn);
}

export function stunHzvHelper(hzvText: string) {
  const value = parseInt(hzvText, 10);
  return value === 0 ? '-' : value;
}

export default class MHWCommand extends BlepBotCommand {
  name = 'mhw';

  subcommands = [
    {
      name: 'hzv',
      usage: `${this.name} hzv [monster]`,
      description: 'Gets the hitzone values for `[monster]` (from Kiranico).',
      execute: this.getHitzones,
      arguments: [
        {
          name: 'monsterName',
          infinite: true,
        },
      ],
    },
  ];

  hitzones: Collection<Hitzone>;

  fuse: Fuse<string>;

  template: Handlebars.TemplateDelegate;

  constructor(client: BlepBotClient) {
    super(client);
    this.hitzones = client.db.collection('mhwiHitzones');
    fs.mkdirSync(PNG_DIRECTORY, { recursive: true });
    this.hitzones.distinct('monster.name').then((names) => {
      this.fuse = new Fuse(names, FUSE_OPTIONS);
    });
    // precompile handlebars template
    Handlebars.registerHelper('rawHzv', rawHzvHelper);
    Handlebars.registerHelper('eleHzv', eleHzvHelper);
    Handlebars.registerHelper('stunHzv', stunHzvHelper);
    const templateRaw = fs.readFileSync(HANDLEBARS_TEMPLATE_FILEPATH, { encoding: 'utf-8' });
    this.template = Handlebars.compile(templateRaw);
  }

  execute(message: Message): void {
    error(message, `Please use one of the subcommands directly (e.g. \`${this.client.commandPrefix}${this.name} hzv\`)`);
  }

  async hzvTableToPng(monsterName: string) {
    const outpath = path.join(PNG_DIRECTORY, `${slugify(monsterName, { lower: true })}.png`);
    if (!fs.existsSync(outpath)) {
      const hitzoneData = await (this.hitzones.find({
        'monster.name': monsterName,
      })).toArray();
      const completedHtml = this.template({ hitzoneData });
      await nodeHtmlToImage({
        output: outpath,
        html: completedHtml,
      });
    }
    return outpath;
  }

  async sendHzvs(message: Message, monsterName: string): Promise<void> {
    const loadingMessage = message.channel.send(`⌛Loading hitzone data for ${monsterName}...`);
    const hzvTablePng = await this.hzvTableToPng(monsterName);
    const content = `Iceborne hitzone data for ${monsterName}:`;
    const files = [{
      attachment: hzvTablePng,
      name: 'hzvtable.png',
    }];
    (await loadingMessage).edit('\u200b');
    message.channel.send(content, { files });
  }

  async getHitzones(message: Message, args: string[]): Promise<Message | void> {
    const query = args[0];
    const matches = this.fuse.search(query);
    if (matches.length === 0) {
      return error(message, `No results found for \`${query}\`.`);
    }
    let monsterName: string;
    if (matches.length === 1 || matches[0].score < EPSILON) {
      monsterName = matches[0].item;
    } else {
      const choiceIndex = await choose(message, matches.map((match) => match.item));
      if (choiceIndex == null) {
        return null;
      }
      monsterName = matches[choiceIndex].item;
    }
    return this.sendHzvs(message, monsterName);
  }
}
