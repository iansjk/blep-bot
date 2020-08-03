import { Message, TextChannel } from 'discord.js';

export interface Trigger {
  condition: RegExp,
  channelIds?: string[],
  execute: (message: Message) => void
}
