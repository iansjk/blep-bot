import { Message } from 'discord.js';

export const error = (message: Message, errorMessage: string) => {
  message.channel.send(`❌ ${errorMessage}`);
};

export const success = (message: Message, successMessage: string) => {
  message.channel.send(`✅ ${successMessage}`);
};
