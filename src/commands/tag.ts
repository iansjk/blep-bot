import { Message } from 'discord.js';
import { Collection } from 'mongodb';
import { Tag } from 'tag';
import { ValidationResult } from 'validation-result';
import { BlepBotClient, Command } from '../client/internal';
import { success } from '../common';

export default class TagCommand extends Command {
  name = 'tag';

  aliases = ['t'];

  usage = 'tag [tag-name]';

  description = 'Retrieves the tag `[tag-name]`.';

  subcommands = [
    {
      name: 'create',
      usage: `${this.name} create [tag-name] [content]`,
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
      usage: `${this.name} owner [tag-name]`,
      description: 'Displays the owner of `[tag-name]`.',
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
      usage: `${this.name} edit [tag-name] [new-content]`,
      description: 'If you are the owner of `[tag-name]`, replaces its contents with `[new-content]`.',
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
      usage: `${this.name} delete [tag-name]`,
      description: 'Deletes `[tag-name]` if you are its owner.',
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

  restrictedTagNames = new Set(['help', ...this.subcommands.map((command) => command.name)]);

  tags: Collection<Tag>;

  constructor(client: BlepBotClient) {
    super(client);
    this.tags = client.db.collection('tags');
  }

  async execute(message: Message, args: string[]): Promise<void> {
    // TODO: pass tagArgs to tag content renderer
    // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
    const [tagName, ...tagArgs] = args;
    const tag = await this.tags.findOne({
      guildId: message.guild.id,
      name: tagName,
    });
    message.channel.send(tag.content);
  }

  async createTag(message: Message, args: string[]): Promise<void> {
    const [tagName, content] = args;
    await this.tags.insertOne({
      guildId: message.guild.id,
      ownerId: message.author.id,
      name: tagName,
      content,
    });
    success(message, `Created tag \`${tagName}\`.`);
  }

  async editTag(message: Message, args: string[]): Promise<void> {
    const [tagName, newContent] = args;
    await this.tags.updateOne({
      guildId: message.guild.id,
      name: tagName,
    }, {
      $set: {
        content: newContent,
      },
    });
    success(message, `Successfully edited tag \`${tagName}\`.`);
  }

  async deleteTag(message: Message, args: string[]): Promise<void> {
    const tagName = args[0];
    await this.tags.deleteOne({
      guildId: message.guild.id,
      name: tagName,
    });
    success(message, `Successfully deleted tag \`${tagName}\`.`);
  }

  async getTagOwner(message: Message, args: string[]): Promise<void> {
    const tagName = args[0];
    const tag = await this.tags.findOne({
      guildId: message.guild.id,
      name: tagName,
    });
    const owner = message.guild.members.resolve(tag.ownerId).user;
    message.channel.send(`Tag \`${tagName}\` is owned by \`${owner.tag}\``);
  }

  async tagExists(message: Message, tagName: string): Promise<ValidationResult> {
    const tag = await this.tags.findOne({
      guildId: message.guild.id,
      name: tagName,
    });
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

  async canEditTag(message: Message, tagName: string): Promise<ValidationResult> {
    const tag = await this.tags.findOne({
      guildId: message.guild.id,
      name: tagName,
    });
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

  async isValidNewTagName(message: Message, newTagName: string): Promise<ValidationResult> {
    const response: ValidationResult = await this.tagExists(message, newTagName);
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
