import { Message } from 'discord.js';
import Command from '../types/command';

export default class PingCommand extends Command {
    name = 'ping';

    usage = 'ping';

    description = 'Pings the bot.';

    // eslint-disable-next-line class-methods-use-this
    execute(message: Message): void {
      message.channel.send('Pong!');
    }
}
