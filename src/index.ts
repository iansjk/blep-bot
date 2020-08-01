import dotenv from 'dotenv';
import { Trigger } from 'trigger';
import { BlepBotClient, Command } from './client/internal';
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
const client = new BlepBotClient(process.env.COMMAND_PREFIX);

client.on('ready', () => {
  Commands.forEach((CommandConstructor) => {
    const command: Command = new CommandConstructor(client);
    console.debug(`Loading ${CommandConstructor.name}`);
    client.loadCommand(command);
  });
  Triggers.forEach((TriggerConstructor) => {
    const trigger: Trigger = new TriggerConstructor();
    console.info(`Loading trigger ${TriggerConstructor.name}`);
    client.loadTrigger(trigger);
  });
  console.info('blep-bot ready!');
});

client.login(process.env.DISCORD_TOKEN);
