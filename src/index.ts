import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { BlepBotClient } from './client/internal';
import Commands from './commands/index';
import Triggers from './triggers/index';

const config = dotenv.config();
dotenvExpand(config);

const REQUIRED_ENV_VARS = [
  'COMMAND_PREFIX',
  'DISCORD_TOKEN',
  'MONGODB_DBNAME',
  'MONGODB_URI',
];
REQUIRED_ENV_VARS.forEach((envVar) => {
  if (!Object.prototype.hasOwnProperty.call(process.env, envVar)) {
    throw new Error(`Required environment variable ${envVar} not set`);
  }
});
const client = new BlepBotClient(process.env.COMMAND_PREFIX);

client.on('ready', async () => {
  await Promise.all(
    [...Commands.map((CommandConstructor) => client.loadCommand(CommandConstructor)),
      ...Triggers.map((TriggerConstructor) => client.loadTrigger(TriggerConstructor)),
    ],
  );
  console.info('blep-bot ready!');
});

client.login(process.env.DISCORD_TOKEN);
