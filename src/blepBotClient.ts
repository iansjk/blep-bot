import Command from 'command';
import { Client } from 'discord.js';
import { Trigger } from 'trigger';
import BlepBotMessageHandler from './blepBotMessageHandler';

export default class BlepBotClient extends Client {
  commandPrefix: string;

  messageHandler: BlepBotMessageHandler;

  commands = new Map<string, Command>();

  triggers = new Map<RegExp, Trigger>();

  constructor(commandPrefix: string) {
    super();
    this.commandPrefix = commandPrefix;
    this.messageHandler = new BlepBotMessageHandler(this);

    this.on('message', (message) => this.messageHandler.handleMessage(message));

    process.on('SIGINT', () => {
      console.error('SIGINT received, gracefully shutting down...');
      // make sure to run only once per unique command object
      // (have to deduplicate values() due to command aliases)
      [...new Set([...this.commands.values()])].forEach((command) => {
        command.shutdown();
      });
      process.exit();
    });
  }

  loadCommand(command: Command) {
    if (this.commands.has(command.name)) {
      throw new Error(`Failed to register ${command.name} as a command with the same name is already registered.`);
    }
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach((alias) => {
        this.commands.set(alias, command);
      });
    }
  }

  loadTrigger(trigger: Trigger) {
    if (this.triggers.has(trigger.condition)) {
      throw new Error(`Failed to register trigger ${trigger} as another trigger with the same regex is already registered.`);
    }
    this.triggers.set(trigger.condition, trigger);
  }
}
