import { Client } from 'discord.js';
import { Db, MongoClient } from 'mongodb';
import { Trigger } from 'trigger';
import { BlepBotMessageHandler, BlepBotCommand, HelpCommand } from './internal';

export default class BlepBotClient extends Client {
  commandPrefix: string;

  private messageHandler: BlepBotMessageHandler;

  commands = new Map<string, BlepBotCommand>();

  triggers = new Map<RegExp, Trigger>();

  private mongoClient: MongoClient = new MongoClient(
    process.env.MONGODB_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  );

  db: Db;

  ready: Promise<void>;

  constructor(commandPrefix: string) {
    super({
      presence: {
        activity: {
          name: `${commandPrefix}help`,
          type: 'LISTENING',
        },
      },
    });
    this.commandPrefix = commandPrefix;
    this.messageHandler = new BlepBotMessageHandler(this);
    this.on('message', (message) => this.messageHandler.handleMessage(message));

    process.on('SIGINT', () => {
      console.error('SIGINT received, gracefully shutting down...');
      // make sure to run only once per unique command object
      // (have to deduplicate values() due to command aliases)
      [...new Set([...this.commands.values()])].forEach((command) => {
        command.shutdown();
        this.mongoClient.close();
      });
      process.exit();
    });

    this.ready = new Promise((resolve, reject) => {
      this.mongoClient.connect().then((client) => {
        this.db = client.db(process.env.MONGODB_DBNAME);
        console.log(`Connected to Mongo database "${this.db.databaseName}"`);
        resolve();
      }).catch((e) => {
        reject(e);
      });
    }).then(() => {
      this.loadCommand(HelpCommand);
    });
  }

  async loadCommand(CommandConstructor: new (c: BlepBotClient) => BlepBotCommand): Promise<void> {
    await this.ready;
    const command = new CommandConstructor(this);
    if (this.commands.has(command.name)) {
      throw new Error(`Failed to register ${command.name} as a command with the same name is already registered.`);
    }
    this.commands.set(command.name, command);
    console.debug(`Loaded command: ${this.commandPrefix}${command.name} => ${CommandConstructor.name}`);
    if (command.aliases) {
      command.aliases.forEach((alias) => {
        this.commands.set(alias, command);
        console.debug(`Loaded alias: ${this.commandPrefix}${alias} => ${CommandConstructor.name}`);
      });
    }
  }

  async loadTrigger(TriggerConstructor: new () => Trigger) {
    await this.ready;
    const trigger = new TriggerConstructor();
    if (this.triggers.has(trigger.condition)) {
      throw new Error(`Failed to register trigger ${trigger} as another trigger with the same regex is already registered.`);
    }
    this.triggers.set(trigger.condition, trigger);
    console.debug(`Loaded trigger ${TriggerConstructor.name}`);
  }
}
