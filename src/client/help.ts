import { Message, MessageEmbed } from 'discord.js';
import BlepBotCommand from './blep-bot-command';

export default class HelpCommand extends BlepBotCommand {
  name = 'help';

  usage = 'help';

  description = 'Displays bot command help.';

  execute(message: Message) {
    const uniqueCommands = [...new Set(this.client.commands.values())]
      .sort()
      .flatMap((command) => ((command.subcommands) ? [command, ...command.subcommands] : command));
    const helpEmbed = new MessageEmbed()
      .setColor([46, 204, 113])
      .setTitle('Command help')
      .setTimestamp()
      .addFields(uniqueCommands.map((command) => ({
        name: `${this.client.commandPrefix}${command.usage}`,
        value: `${command.description}`,
      })));
    message.channel.send(helpEmbed);
  }
}
