import { User } from 'discord.js';

export interface Tag {
  name: string,
  ownerId: string,
  guildId: string,
  content: string
}
