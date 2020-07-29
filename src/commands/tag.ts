import { Command } from 'command';
import { Message } from 'discord.js';
import { Tag } from 'tag';
import fs from 'fs';
import path from 'path';
import { error } from '../common';

export default class TagCommand implements Command {
  name = 'tag';

  aliases = ['t'];

  usage = 'tag [tag-name]';

  description = 'Retrieves the tag [tag-name].';

  tags: Map<string, Tag>;

  constructor() {
    this.tags = new Map<string, Tag>();
    const tagDataRaw = fs.readFileSync(path.join(__dirname, '../data/tags.json'), { encoding: 'utf-8' });
    const tags: Tag[] = JSON.parse(tagDataRaw);
    tags.forEach((tag) => {
      this.tags.set(tag.name, tag);
    });
  }

  execute(message: Message, args: string[]): void {
    const tag = this.tags.get(args[0]);
    if (!tag) {
      error(message, `The tag \`${args[0]}\` does not exist.`);
    } else {
      message.channel.send(tag.content);
    }
  }
}
