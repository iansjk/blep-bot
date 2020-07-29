import { Command } from 'command';
import { Client, Message } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { Tag } from 'tag';
import { error, success } from '../common';

const tagFilePath = path.join(__dirname, '../data/tags.json');

export default class TagCommand implements Command {
  name = 'tag';

  aliases = ['t'];

  usage = 'tag [tag-name]';

  description = 'Retrieves the tag [tag-name].';

  subcommands = [
    {
      name: 'create',
      usage: 'create [tag-name] [content]',
      description: 'Creates a new tag named `[tag-name]` containing `[content]`.',
      execute: this.createTag,
    },
    {
      name: 'owner',
      usage: 'owner [tag-name]',
      description: 'Displays the owner of [tag-name].',
      execute: this.getTagOwner,
    },
  ];

  // guild.id -> tag.name -> Tag
  tags: Map<string, Map<string, Tag>> = new Map<string, Map<string, Tag>>();

  subcommandMap = new Map<string, Function>();

  subcommandNames: Set<string>;

  constructor(client: Client) {
    if (fs.existsSync(tagFilePath)) {
      this.tags = JSON.parse(fs.readFileSync(tagFilePath, { encoding: 'utf-8' }), this.reviver);
    }
    [...client.guilds.cache.values()].forEach((guild) => {
      const guildTagMap = this.tags.get(guild.id);
      if (!guildTagMap) {
        this.tags.set(guild.id, new Map<string, Tag>());
      }
    });
    this.subcommands.forEach((subcommand) => {
      this.subcommandMap.set(subcommand.name, subcommand.execute);
    });
    this.subcommandNames = new Set(this.subcommandMap.keys());
  }

  execute(message: Message, args: string[]): void {
    const [first, ...rest] = args;
    if (this.subcommandNames.has(first)) {
      this.subcommandMap.get(first).apply(this, [message, rest]);
    } else {
      const tagMap = this.tags.get(message.guild.id);
      const tag = tagMap.get(args[0]);
      if (!tag) {
        error(message, `The tag \`${args[0]}\` does not exist.`);
      } else {
        message.channel.send(tag.content);
      }
    }
  }

  createTag(message: Message, args: string[]): void {
    const [tagName, ...rest] = args;
    if (!this.isValidTagName(tagName)) {
      error(message, 'Cannot create a tag with this name as it is reserved.');
    } else {
      const tagMap = this.tags.get(message.guild.id);
      if (tagMap.get(tagName)) {
        error(message, 'A tag with this name already exists.');
      } else {
        const content = rest.join(' ').trim();
        if (content.length === 0) {
          error(message, 'No content specified for tag.');
        } else {
          tagMap.set(tagName, {
            name: tagName,
            ownerId: message.author.id,
            content,
          });
          success(message, `Created tag \`${tagName}\`.`);
        }
      }
    }
  }

  getTagOwner(message: Message, args: string[]): void {
    const [tagName, ...rest] = args;
    if (rest.length > 0) {
      error(message, 'Too many arguments.');
    } else {
      const tag = this.tags.get(message.guild.id).get(tagName);
      if (!tag) {
        error(message, `The tag \`${args[0]}\` does not exist.`);
      } else {
        const owner = message.guild.members.resolve(tag.ownerId).user;
        message.channel.send(`Tag \`${tagName}\` is owned by \`${owner.tag}\``);
      }
    }
  }

  isValidTagName(tagName: string): boolean {
    return !(this.subcommandNames.has(tagName));
  }

  shutdown(): void {
    fs.writeFileSync(tagFilePath, JSON.stringify(this.tags, this.replacer), { encoding: 'utf-8' });
  }

  // encode Map as { dataType: 'Map', value: <array of 2-arrays> }
  // eslint-disable-next-line class-methods-use-this
  replacer(_: string, value: any): any {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: [...value.entries()],
      };
    }
    return value;
  }

  // decode JSONified Maps produced by replacer()
  // eslint-disable-next-line class-methods-use-this
  reviver(_: string, value: any) {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }
}
