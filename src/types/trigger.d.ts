import { Message } from 'discord.js';

export interface Trigger {
  condition: RegExp,
  execute: (message: Message) => void
}
