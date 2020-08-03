import { GuildChannel, Message } from 'discord.js';
import { error, splitWhitespaceNTimes } from '../common';
import { BlepBotCommand, BlepBotClient } from './internal';

export default class BlepBotMessageHandler {
  client: BlepBotClient;

  constructor(client: BlepBotClient) {
    this.client = client;
  }

  async handleMessage(message: Message): Promise<void> {
    if (!message.author.bot) {
      if (message.content.startsWith(this.client.commandPrefix)) {
        const commandString = message.content.slice(this.client.commandPrefix.length);
        // eslint-disable-next-line prefer-const
        let [command, argString] = splitWhitespaceNTimes(commandString, 1);
        let handler: BlepBotCommand = this.client.commands.get(command);
        let parentHandler: BlepBotCommand;
        if (!handler) {
          error(message, `Unrecognized command \`${command}\`.`);
        } else if (!(message.channel instanceof GuildChannel) && handler.guildOnly) {
          error(message, 'This command can only be executed in a server.');
        } else {
          while (handler.subcommands?.length > 0) {
            const [subcommand, subcommandArgString] = splitWhitespaceNTimes(argString, 1);
            const subcommandIndex = handler.subcommands.map((sc) => sc.name).indexOf(subcommand);
            if (subcommandIndex >= 0) {
              parentHandler = handler;
              handler = handler.subcommands[subcommandIndex];
              argString = subcommandArgString;
            } else {
              break;
            }
          }
          if (!handler.arguments || handler.arguments.length === 0) {
            if (argString?.length > 0) {
              error(message, `Unexpected arguments: \`${argString}\``);
            } else {
              handler.execute.apply(parentHandler || handler, [message, []]);
            }
          } else {
            let canExecute = true;
            const args = splitWhitespaceNTimes(argString, handler.arguments.length - 1);
            await Promise.all(handler.arguments.map(async (argument, i) => {
              if (!argument.optional && (!args[i] || args[i].length === 0)) {
                error(message, `Required argument \`${handler.arguments[i].name}\` was empty.`);
                canExecute = false;
              } else if (i === handler.arguments.length - 1 && !argument.infinite) {
                const extraArgs = splitWhitespaceNTimes(argString, handler.arguments.length).pop();
                if (extraArgs) {
                  error(message, `Unexpected extra arguments: \`${extraArgs}\``);
                  canExecute = false;
                }
              } else if (argument.validator) {
                const validationResult = await argument.validator
                  .apply(parentHandler || handler, [message, args[i]]);
                if (!validationResult.valid) {
                  error(message, validationResult.errorMessage);
                  canExecute = false;
                }
              }
            }));
            if (canExecute) {
              handler.execute.apply(parentHandler || handler, [message, args]);
            }
          }
        }
      } else {
      // eslint-disable-next-line no-restricted-syntax
        for (const [regex, trigger] of this.client.triggers) {
          if (regex.test(message.content)
            && (!(trigger.channelIds?.length > 0)
            || trigger.channelIds.indexOf(message.channel.id) >= 0)) {
            this.client.triggers.get(regex).execute(message);
          }
        }
      }
    }
  }
}
