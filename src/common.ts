import { Message, Emoji, MessageReaction } from 'discord.js';

function emojiToNumber(emoji: Emoji): number {
  switch (emoji.name) {
    case '1️⃣':
      return 1;
    case '2️⃣':
      return 2;
    case '3️⃣':
      return 3;
    case '4️⃣':
      return 4;
    case '5️⃣':
      return 5;
    case '6️⃣':
      return 6;
    case '7️⃣':
      return 7;
    case '8️⃣':
      return 8;
    case '9️⃣':
      return 9;
    default:
      return NaN;
  }
}

function numberToEmojiName(i: number): string {
  switch (i) {
    case 1:
      return '1️⃣';
    case 2:
      return '2️⃣';
    case 3:
      return '3️⃣';
    case 4:
      return '4️⃣';
    case 5:
      return '5️⃣';
    case 6:
      return '6️⃣';
    case 7:
      return '7️⃣';
    case 8:
      return '8️⃣';
    case 9:
      return '9️⃣';
    default:
      throw new Error(`Failed to convert number to emoji: ${i} not valid`);
  }
}

export const error = (message: Message, errorMessage: string) => {
  message.channel.send(`❌ ${errorMessage}`);
};

export const success = (message: Message, successMessage: string) => {
  message.channel.send(`✅ ${successMessage}`);
};

export const splitWhitespaceNTimes = (toSplit: string, times: number): string[] => {
  if (times < 0) {
    throw new Error('Number of times cannot be negative');
  } else if (!toSplit) {
    return [];
  } else if (times === 0) {
    return [toSplit];
  } else {
    const splits: string[] = [];
    let remnant = toSplit;
    let timesRemaining = times;
    let match;
    do {
      match = remnant.match(/\s+/);
      if (match) {
        splits.push(remnant.slice(0, match.index));
        remnant = remnant.slice(match.index + match[0].length);
        timesRemaining -= 1;
      }
    } while (match && timesRemaining > 0);
    if (remnant) {
      splits.push(remnant);
    }
    for (timesRemaining; timesRemaining > 0; timesRemaining -= 1) {
      splits.push(null);
    }
    return splits;
  }
};

export const choose = async (message: Message, choices: string[]): Promise<number> => {
  const requestingUser = message.author;
  let content = 'Please make a selection by typing or reacting with a number.\n'
    + 'Type `cancel` or react with ❌ to cancel.\n';
  choices.forEach((choice, i) => {
    content += `${numberToEmojiName(i + 1)} ${choice}\n`;
  });
  const menuMessage = await message.channel.send(content);
  const addReactions = Promise.all([
    ...Array(choices.length).fill(0).map(
      async (_, i) => menuMessage.react(numberToEmojiName(i + 1)),
    ),
    menuMessage.react('❌'),
  ]);
  const responses = await Promise.race([
    menuMessage.awaitReactions(
      (reaction, user) => (reaction.emoji.name === '❌' || !Number.isNaN(emojiToNumber(reaction.emoji)))
      && user.id === requestingUser.id,
      {
        max: 1,
        time: 20000,
      },
    ),
    message.channel.awaitMessages(
      (choiceMessage) => {
        const number = parseInt(choiceMessage.content.trim(), 10);
        return choiceMessage.author.id === requestingUser.id
          && (choiceMessage.content.toLowerCase().indexOf('cancel') >= 0
          || (!Number.isNaN(number) && number >= 1 && number <= choices.length));
      },
      {
        max: 1,
        time: 20000,
      },
    )]);
  let messageAfterChoice = '\u200b';
  if (responses.size === 0) {
    messageAfterChoice = '❕Selection timed out.';
  }
  let selection: number = null;
  const response = responses.first();
  if (response instanceof MessageReaction) {
    if (response.emoji.name === '❌') {
      messageAfterChoice = '❕Selection cancelled.';
    } else {
      selection = emojiToNumber(response.emoji) - 1;
    }
  }
  if (response instanceof Message) {
    if (response.content.toLowerCase().indexOf('cancel') >= 0) {
      messageAfterChoice = '❕Selection cancelled.';
    } else {
      selection = parseInt(response.content, 10) - 1;
    }
  }
  menuMessage.edit(messageAfterChoice);
  addReactions.then(() => { menuMessage.reactions.removeAll(); });
  return selection;
};
