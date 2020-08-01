import { Message } from 'discord.js';
import { ValidationResult } from '../types/validation-result';
import BlepBotClient from './blep-bot-client';

interface Argument {
  name: string,
  optional?: boolean, // default false
  infinite?: boolean, // default false
  validator?(message: Message, value: string): ValidationResult | Promise<ValidationResult>
}

export default abstract class BlepBotCommand {
  name: string;

  aliases?: string[];

  usage: string;

  description: string;

  subcommands?: BlepBotCommand[];

  arguments?: Argument[];

  client?: BlepBotClient;

  guildOnly? = false;

  optional? = false;

  constructor(client: BlepBotClient) {
    this.client = client;
  }

  abstract execute(message: Message, args: string[]): Promise<Message | void> | void;

  // eslint-disable-next-line class-methods-use-this
  shutdown?(): void {}
}
