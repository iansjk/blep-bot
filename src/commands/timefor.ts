import { Message, User } from 'discord.js';
import moment from 'moment-timezone';
import cityTimezones from 'city-timezones';
import { Collection } from 'mongodb';
import { BlepBotClient, BlepBotCommand } from '../client/internal';
import { error, success } from '../common';

export default class TimeForCommand extends BlepBotCommand {
  name = 'timefor';

  aliases = ['tf'];

  usage = 'timefor [user?]';

  description = 'Displays the local time for [user], or your local time if [user] is empty.';

  arguments = [
    {
      name: 'user',
      optional: true,
    },
  ];

  subcommands = [
    {
      name: 'set',
      usage: `${this.name} set [city-name]`,
      description: 'Sets your timezone to the timezone for `[city-name]`.',
      execute: this.setTimezone,
      arguments: [
        {
          name: 'timezone',
          infinite: true,
        },
      ],
    },
  ];

  userTimezones: Collection;

  constructor(client: BlepBotClient) {
    super(client);
    this.userTimezones = client.db.collection('userTimezones');
  }

  async execute(message: Message, args: string[]): Promise<Message | void> {
    const userName = args[0];
    let user: User;
    if (!userName) {
      user = message.author;
    } else {
      const member = (await message.guild.members.fetch({
        query: userName,
        limit: 1,
      })).first();
      if (!member) {
        return error(message, `Couldn't find a member matching \`${userName}\`.`);
      }
      user = member.user;
    }
    const userTimezone = await this.userTimezones.findOne({ userId: user.id });
    if (!userTimezone) {
      return error(message, (user.id === message.author.id)
        ? `You have not set your timezone yet. Use \`${this.client.commandPrefix}${this.subcommands[0].usage}\` to do so.`
        : `User \`${user.tag}\` has not set their timezone.`);
    }
    const momentObj = moment().tz(userTimezone.timezone);
    return message.channel.send(`It is **${momentObj.format('h:mm A')}** in \`${user.tag}\`'s timezone (\`${userTimezone.timezone}\`)`);
  }

  // eslint-disable-next-line class-methods-use-this
  async setTimezone(message: Message, args: string[]): Promise<void> {
    const city = args[0];
    const result = cityTimezones.lookupViaCity(city)[0];
    if (!result) {
      return error(message, `Couldn't find any results matching \`${city}\`.`);
    }
    await this.userTimezones.updateOne({
      userId: message.author.id,
    }, {
      $set: { timezone: result.timezone },
    }, {
      upsert: true,
    });
    return success(message, `I've set your timezone to \`${result.timezone}.\``);
  }
}
