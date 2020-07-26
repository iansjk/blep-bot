import Discord from 'discord.js';
import dotenv = require('dotenv');

dotenv.config();

const REQUIRED_ENV_VARS = ['PREFIX', 'DISCORD_TOKEN'];
REQUIRED_ENV_VARS.forEach((envVar) => {
  if (!Object.prototype.hasOwnProperty.call(process.env, envVar)) {
    throw new Error(`Required environment variable ${envVar} not set`);
  }
});
const client = new Discord.Client();

client.on('ready', () => {
  // eslint-disable-next-line no-console
  console.info('blep-bot ready!');
});

client.login(process.env.DISCORD_TOKEN);
