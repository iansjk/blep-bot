import { Trigger } from 'trigger';
import { Message } from 'discord.js';

export default class FloppyTrigger implements Trigger {
  private FLOPPY_USER_ID = '159133099806949376';

  condition = /^\s*::[^:]+::\s*$/;

  execute(message: Message): void {
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
