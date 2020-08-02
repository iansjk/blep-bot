import { Message } from 'discord.js';
import { YouTube } from 'popyt';
import { BlepBotClient, BlepBotCommand } from '../client/internal';

export default class YouTubeCommand extends BlepBotCommand {
  name = 'youtube';

  aliases = ['yt'];

  usage = 'youtube [search-string]';

  description = 'Searches YouTube for `search-string` and embeds the best match.';

  arguments = [
    {
      name: 'searchString',
      infinite: true,
    },
  ];

  yt: YouTube;

  constructor(client: BlepBotClient) {
    super(client);
    if (!Object.prototype.hasOwnProperty.call(process.env, 'YOUTUBE_API_KEY')) {
      throw Error('The environment variable YOUTUBE_API_KEY is not set');
    }
    this.yt = new YouTube(process.env.YOUTUBE_API_KEY);
  }

  async execute(message: Message, args: string[]) {
    const searchString = args[0];
    const result = await this.yt.getVideo(searchString);
    message.channel.send(result.url);
  }
}
