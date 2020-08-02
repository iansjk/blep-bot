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

function hzvHelper(text: string) {
  const value = parseInt(text, 10);
  if (value === 0) {
    return '-';
  } else if (value >= 45) {
    return new Handlebars.SafeString(`<b>${value}</b>`);
  }
  return value;
}

function eleHzvHelper(text: string) {
  const value = parseInt(text, 10);
  if (value === 0) {
    return '-';
  }
  return text; // TODO
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
    Handlebars.registerHelper('hzv', hzvHelper);
    Handlebars.registerHelper('eleHzv', eleHzvHelper);
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
