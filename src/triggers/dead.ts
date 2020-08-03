import { Trigger } from 'trigger';
import { Message } from 'discord.js';

export default class DeadTrigger implements Trigger {
  condition = /^\s*dead((?:er)*)((?:est)*)\s*$/;

  channelIds = [
    '714713589440839702',
    '731381635550937099',
    '735507005837541437',
  ]

  execute(message: Message) {
    const match = this.condition.exec(message.content);
    const response = `dead${match[1] || ''}er${match[2] || ''}`;
    message.channel.send(response);
  }
}
