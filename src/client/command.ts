import { Client, Message } from 'discord.js';
import { ValidationResult } from 'validationResult';
import BlepBotClient from './blepBotClient';

interface Argument {
  name: string,
  optional?: boolean, // default false
  infinite?: boolean, // default false
  validator?(message: Message, value: string): ValidationResult
}

export default abstract class Command {
  name: string;

  aliases?: string[];

  usage: string;

  description: string;

  subcommands?: Command[];

  arguments?: Argument[];

  client?: Client;

  guildOnly? = false;

  optional? = false;

  constructor(client: BlepBotClient) {
    this.client = client;
  }

  abstract execute(message: Message, args: string[]): Promise<Message | void> | void;

  // eslint-disable-next-line class-methods-use-this
  shutdown?(): void {}
}
