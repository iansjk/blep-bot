import { Client, Message } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { Tag } from 'tag';
import { ValidationResult } from 'validationResult';
import { error, success } from '../common';
import Command from '../types/command';

const tagFilePath = path.join(__dirname, '../data/tags.json');

export default class TagCommand extends Command {
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
      arguments: [
        {
          name: 'tagName',
          validator: this.isValidNewTagName,
        },
        {
          name: 'content',
          infinite: true,
        },
      ],
    },
    {
      name: 'owner',
      usage: 'owner [tag-name]',
      description: 'Displays the owner of [tag-name].',
      execute: this.getTagOwner,
      arguments: [
        {
          name: 'tagName',
          validator: this.tagExists,
        },
      ],
    },
    {
      name: 'edit',
      usage: 'edit [tag-name] [new-content]',
      description: 'If you are the owner of [tag-name], replaces its contents with [new-content].',
      execute: this.editTag,
      arguments: [
        {
          name: 'tagName',
          validator: this.canEditTag,
        },
        {
          name: 'newContent',
          infinite: true,
        },
      ],
    },
    {
      name: 'delete',
      usage: 'delete [tag-name]',
      description: 'Deletes [tag-name] if you are its owner.',
      execute: this.deleteTag,
      arguments: [
        {
          name: 'tagName',
          validator: this.canEditTag,
        },
      ],
    },
  ];

  arguments = [
    {
      name: 'tagName',
      validator: this.tagExists,
    },
    {
      name: 'tagArgs',
      optional: true,
      infinite: true,
    },
  ];

  guildOnly = true;

  // guild.id -> tag.name -> Tag
  tags: Map<string, Map<string, Tag>> = new Map<string, Map<string, Tag>>();

  restrictedTagNames = new Set(['help', [...this.subcommands.map((command) => command.name)]]);

  constructor(client: Client) {
    super(client);
    if (fs.existsSync(tagFilePath)) {
      console.debug(`Loading tag data from ${tagFilePath}`);
      this.tags = JSON.parse(fs.readFileSync(tagFilePath, { encoding: 'utf-8' }), this.reviver);
      console.debug('Successfully loaded tag data.');
    }
    [...client.guilds.cache.values()].forEach((guild) => {
      const guildTagMap = this.tags.get(guild.id);
      if (!guildTagMap) {
        this.tags.set(guild.id, new Map<string, Tag>());
      }
    });
  }

  execute(message: Message, args: string[]): void {
    // TODO: pass tagArgs to tag content renderer
    // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
    const [tagName, ...tagArgs] = args;
    const tag = this.tags.get(message.guild.id).get(tagName);
    message.channel.send(tag.content);
  }

  createTag(message: Message, args: string[]): void {
    const [tagName, content] = args;
    this.tags.get(message.guild.id).set(tagName, {
      name: tagName,
      ownerId: message.author.id,
      content,
    });
    success(message, `Created tag \`${tagName}\`.`);
  }

  editTag(message: Message, args: string[]): void {
    const [tagName, newContent] = args;
    const tag = this.tags.get(message.guild.id).get(tagName);
    tag.content = newContent;
    success(message, `Successfully edited tag \`${tagName}\`.`);
  }

  deleteTag(message: Message, args: string[]): void {
    const tagName = args[0];
    this.tags.get(message.guild.id).delete(tagName);
    success(message, `Successfully deleted tag \`${tagName}\`.`);
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

  tagExists(message: Message, tagName: string): ValidationResult {
    const tag = this.tags.get(message.guild.id).get(tagName);
    if (!tag) {
      return {
        valid: false,
        errorMessage: 'No such tag.',
      };
    }
    return {
      valid: true,
    };
  }

  canEditTag(message: Message, tagName: string): ValidationResult {
    const tag = this.tags.get(message.guild.id).get(tagName);
    if (!tag) {
      return {
        valid: false,
        errorMessage: 'No such tag.',
      };
    }
    if (message.author.id !== tag.ownerId) {
      return {
        valid: false,
        errorMessage: 'You are not the owner of this tag.',
      };
    }
    return {
      valid: true,
    };
  }

  isValidNewTagName(message: Message, newTagName: string): ValidationResult {
    const response: ValidationResult = this.tagExists(message, newTagName);
    if (response.valid) {
      return {
        valid: false,
        errorMessage: 'This tag already exists.',
      };
    }
    if (this.restrictedTagNames.has(newTagName)) {
      return {
        valid: false,
        errorMessage: 'You cannot make a tag with this name as the name is reserved.',

      };
    }
    return {
      valid: true,
    };
  }

  shutdown(): void {
    console.debug(`Shutting down, writing tag data to ${tagFilePath}`);
    fs.mkdirSync(path.join(tagFilePath, '..'), { recursive: true });
    fs.writeFileSync(tagFilePath, JSON.stringify(this.tags, this.replacer), { encoding: 'utf-8' });
    console.debug('Tag data saved.');
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
