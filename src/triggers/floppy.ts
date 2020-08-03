import { Message } from 'discord.js';
import { Trigger } from 'trigger';

export default class FloppyTrigger implements Trigger {
  private FLOPPY_USER_ID = '159133099806949376';

  condition = /^\s*::[^:]+::\s*$/;

  async execute(message: Message): Promise<void> {
    const previousMessage = (await message.channel.messages.fetch({
      limit: 1,
      before: message.id,
    })).first();
    if (previousMessage.author.id === message.author.id) {
      message.channel.awaitMessages(
        (m) => m.author.id === this.FLOPPY_USER_ID,
        {
          max: 1,
          time: 1000,
        },
      ).then((m) => {
        if (m.size > 0) {
          message.delete().catch((e) => {
            console.error(e);
          });
        }
      });
    }
  }
}
