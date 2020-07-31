import { Message } from 'discord.js';

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
