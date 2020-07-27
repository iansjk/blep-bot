import Discord from 'discord.js';
import Commands from './commands/index';
import { Command } from './commands/command';

// eslint-disable-next-line import/newline-after-import, import/order
import dotenv = require('dotenv');
dotenv.config();

const REQUIRED_ENV_VARS = ['PREFIX', 'DISCORD_TOKEN'];
REQUIRED_ENV_VARS.forEach((envVar) => {
  if (!Object.prototype.hasOwnProperty.call(process.env, envVar)) {
    throw new Error(`Required environment variable ${envVar} not set`);
  }
});
const client = new Discord.Client();
const commands = new Map<string, Command>();

client.on('ready', () => {
  Commands.forEach((CommandConstructor) => {
    const command: Command = new CommandConstructor();
    commands.set(command.name, command);
    console.info(`Registered command: ${process.env.PREFIX}${command.name} => ${CommandConstructor.name}`);
    if (command.aliases) {
      command.aliases.forEach((alias) => {
        if (commands.has(alias)) {
          throw new Error(`Command conflict: attempted to register ${process.env.PREFIX}${alias} but it already exists`);
        }
        commands.set(alias, command);
      });
    }
  });
  console.info('blep-bot ready!');
});

client.on('message', (message) => {
  if (!message.author.bot && message.content.startsWith(process.env.PREFIX)) {
    const [command, ...args] = message.content.slice(process.env.PREFIX.length).trim().split(' ');
    const handler = commands.get(command);
    if (handler) {
      handler.execute(message, args);
    } else {
      message.channel.send(`❌ Unrecognized command \`${command}\`.`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
