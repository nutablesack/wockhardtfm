import { Command } from 'discord.js-commando';
import { MessageEmbed } from 'discord.js';
import { fetchUserInfo } from '../../api/lastfm';
import { USER_UNDEFINED_ARGS } from '../../constants';

export default class InfoCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'fminfo',
      memberName: 'fminfo',
      group: 'lastfm',
      description: 'Returns information about a Last.fm profile.',
      guildOnly: true,
      throttling: {
        usages: 1,
        duration: 5
      },
      args: [
        {
          key: 'fmUser',
          prompt: 'Enter a registered Last.fm username.',
          type: 'string',
          default: msg => this.client.util.userInDatabase(msg.author.id)
        }
      ]
    });
  }

  async run(msg, { fmUser }) {
    msg.channel.startTyping();
    if (!fmUser) {
      msg.channel.stopTyping();
      return this.client.util.replyEmbedMessage(
        msg,
        this.name,
        USER_UNDEFINED_ARGS
      );
    }

    const {
      error,
      totalScrobbles,
      name,
      profileURL,
      country,
      image,
      unixRegistration
    } = await fetchUserInfo(fmUser);
    if (error) {
      msg.channel.stopTyping();
      return this.client.util.replyEmbedMessage(msg, null, error, { fmUser });
    }

    const lastFMAvatar = image[2]['#text'];

    msg.channel.stopTyping();
    return msg.say(
      new MessageEmbed()
        .setAuthor(name, lastFMAvatar, profileURL)
        .setThumbnail(lastFMAvatar)
        .addField('Total Scrobbes', totalScrobbles)
        .addField('Country', country)
        .addField(
          'Registration Date',
          new Date(unixRegistration * 1000).toLocaleString()
        )
        .setColor(this.client.color)
    );
  }
}
