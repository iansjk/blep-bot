import { Message } from 'discord.js';
import { BlepBotCommand } from '../client/internal';
import { success, error } from '../common';

export default class CallMeCommand extends BlepBotCommand {
  name = 'callme';

  usage = 'callme [new-nickname]';

  description = 'Changes your nickname to `[new-nickname]`.';

  arguments = [
    {
      name: 'newNickname',
    },
  ];

  guildOnly = true;

  // eslint-disable-next-line class-methods-use-this
  execute(message: Message, args: string[]) {
    const newNickname = args[0];
    const guildMember = message.guild.members.resolve(message.author);
    guildMember.setNickname(newNickname).then(() => {
      success(message, `Hi there, ${newNickname}.`);
    }).catch((e) => {
      error(message, "I can't change your nickname for you (you're too powerful!)");
      console.error(e);
    });
  }
}
