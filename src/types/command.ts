import { Message, Client } from 'discord.js';
import { ValidationResult } from 'validationResult';

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

  constructor(client: Client) {
    this.client = client;
  }

  abstract execute(message: Message, args: string[]): Promise<Message | void> | void;

  // eslint-disable-next-line class-methods-use-this
  shutdown?(): void {}
}
