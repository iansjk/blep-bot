import { Message } from 'discord.js';

export interface Command {
  name: string;
  aliases?: string[];
  usage: string;
  description: string;
  subcommands?: Command[];
  execute: (message: Message, args: string[]) => Promise<Message | void> | void;
  shutdown?: () => void
}
