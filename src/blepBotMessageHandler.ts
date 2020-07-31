import { Message, GuildChannel } from 'discord.js';
import Command from 'command';
import { error } from './common';

export default class BlepBotMessageHandler {
  client: any;

  // client should be a BlepBotClient
  // (type set to 'any' due to dependency cycle)
  constructor(client: any) {
    this.client = client;
  }

  async handleMessage(message: Message): Promise<void> {
    if (!message.author.bot && message.content.startsWith(this.client.commandPrefix)) {
      const commandString = message.content.slice(this.client.commandPrefix.length);
      // eslint-disable-next-line prefer-const
      let [command, argString] = this.splitWhitespaceNTimes(commandString, 1);
      let handler: Command = this.client.commands.get(command);
      let parentHandler: Command;
      if (!handler) {
        error(message, `Unrecognized command \`${command}\`.`);
      } else if (!(message.channel instanceof GuildChannel) && handler.guildOnly) {
        error(message, 'This command can only be executed in a server.');
      } else {
        while (handler.subcommands?.length > 0) {
          const [subcommand, subcommandArgString] = this.splitWhitespaceNTimes(argString, 1);
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
            handler.execute(message, []);
          }
        } else {
          let canExecute = true;
          const args = this.splitWhitespaceNTimes(argString, handler.arguments.length - 1);
          handler.arguments.forEach((argument, i) => {
            if (!argument.optional && (!args[i] || args[i].length === 0)) {
              error(message, `Required argument \`${handler.arguments[i].name}\` was empty.`);
              canExecute = false;
            } else if (i === handler.arguments.length - 1 && !argument.infinite) {
              const extraArgs = this
                .splitWhitespaceNTimes(argString, handler.arguments.length)
                .pop();
              if (extraArgs) {
                error(message, `Unexpected extra arguments: \`${extraArgs}\``);
                canExecute = false;
              }
            } else if (argument.validator) {
              const validationResult = argument.validator
                .apply(parentHandler || handler, [message, args[i]]);
              if (!validationResult.valid) {
                error(message, validationResult.errorMessage);
                canExecute = false;
              }
            }
          });
          if (canExecute) {
            handler.execute.apply(parentHandler || handler, [message, args]);
          }
        }
      }
    } else {
      [...this.client.triggers.keys()].forEach((regex) => {
        if (regex.test(message.content)) {
          this.client.triggers.get(regex).execute(message);
        }
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private splitWhitespaceNTimes(toSplit: string, times: number): string[] {
    if (times < 0) {
      throw new Error('Number of times cannot be negative');
    } else if (!toSplit) {
      return [];
    } else if (times === 0) {
      return [toSplit];
    } else {
      const splits: string[] = [];
      let remnant = toSplit;
      let timesRemaining = times;
      let match;
      do {
        match = remnant.match(/\s+/);
        if (match) {
          splits.push(remnant.slice(0, match.index));
          remnant = remnant.slice(match.index + match[0].length);
          timesRemaining -= 1;
        }
      } while (match && timesRemaining > 0);
      if (remnant) {
        splits.push(remnant);
      }
      for (timesRemaining; timesRemaining > 0; timesRemaining -= 1) {
        splits.push(null);
      }
      return splits;
    }
  }
}
