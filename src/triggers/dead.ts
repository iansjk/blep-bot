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
    let er = match[1] || '';
    let est = match[2] || '';
    if (Math.random() <= 0.5) {
      er += 'er';
    } else {
      est += 'est';
    }
    const response = `dead${er}${est}`;
    message.channel.send(response);
  }
}
