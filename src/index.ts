import Discord from 'discord.js';
import type { Trigger } from 'trigger';
import type { Command } from 'command';
import Commands from './commands/index';
import Triggers from './triggers/index';

// eslint-disable-next-line import/newline-after-import, import/order
import dotenv = require('dotenv');
dotenv.config();

const REQUIRED_ENV_VARS = ['COMMAND_PREFIX', 'DISCORD_TOKEN'];
REQUIRED_ENV_VARS.forEach((envVar) => {
  if (!Object.prototype.hasOwnProperty.call(process.env, envVar)) {
    throw new Error(`Required environment variable ${envVar} not set`);
  }
});
const client = new Discord.Client();
const commands = new Map<string, Command>();
const triggers = new Map<RegExp, Trigger>();

client.on('ready', () => {
  Commands.forEach((CommandConstructor) => {
    const command: Command = new CommandConstructor(client);
    commands.set(command.name, command);
    console.info(`Registered command: ${process.env.COMMAND_PREFIX}${command.name} => ${CommandConstructor.name}`);
    if (command.aliases) {
      command.aliases.forEach((alias) => {
        if (commands.has(alias)) {
          throw new Error(`Command conflict: attempted to register ${process.env.COMMAND_PREFIX}${alias} but it already exists`);
        }
        commands.set(alias, command);
      });
    }
  });
  Triggers.forEach((TriggerConstructor) => {
    const trigger: Trigger = new TriggerConstructor();
    triggers.set(trigger.condition, trigger);
    console.info(`Registered trigger ${TriggerConstructor.name}`);
  });
  console.info('blep-bot ready!');
});

client.on('message', (message) => {
  if (!message.author.bot && message.content.startsWith(process.env.COMMAND_PREFIX)) {
    const [command, ...args] = message.content.slice(process.env.COMMAND_PREFIX.length).trim().split(' ');
    const handler = commands.get(command);
    if (handler) {
      handler.execute(message, args);
    } else {
      message.channel.send(`❌ Unrecognized command \`${command}\`.`);
    }
  } else {
    [...triggers.keys()].forEach((regex) => {
      if (regex.test(message.content)) {
        triggers.get(regex).execute(message);
      }
    });
  }
});

client.login(process.env.DISCORD_TOKEN);

process.on('SIGINT', () => {
  console.error('SIGINT received, gracefully shutting down...');
  commands.forEach((command) => {
    if ('shutdown' in command) {
      command.shutdown();
    }
  });
  process.exit();
});
