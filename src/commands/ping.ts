import { Message } from 'discord.js';
import { BlepBotCommand } from '../client/internal';

export default class PingCommand extends BlepBotCommand {
    name = 'ping';

    usage = 'ping';

    description = 'Pings the bot.';

    // eslint-disable-next-line class-methods-use-this
    execute(message: Message): void {
      message.channel.send('Pong!');
    }
}
