import { MessageEmbed } from 'discord.js';
import { Command } from 'discord.js-commando';
import { fetchArtistInfo, fetchRecentTrack } from '../../api/lastfm';
import { USER_UNDEFINED, NOT_ENOUGH_LISTENERS } from '../../constants';
import db from '../../db';

export default class WhoKnowsArtistCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'whoknows',
      memberName: 'whoknows',
      aliases: ['wk'],
      group: 'lastfm',
      description: 'Returns the top listeners in the server of an artist.',
      guildOnly: true,
      throttling: {
        usages: 1,
        duration: 5
      },
      args: [
        {
          key: 'artistName',
          prompt: 'Enter an artist name.',
          type: 'string',
          default: ''
        }
      ]
    });
  }

  async run(msg, { artistName }) {
    msg.channel.startTyping();
    const fmUser = this.client.util.userInDatabase(msg.author.id);
    if (!artistName) {
      /**
       * If no artistName is given, it checks to see if the user has both set
       * their Last.fm username with Lasty and has scrobbled a track. If the user
       * has recently scrobbled, we use their recent track to find the artistName.
       */
      if (!fmUser) {
        msg.channel.stopTyping();
        return this.client.util.replyEmbedMessage(msg, null, USER_UNDEFINED);
      }

      const { error, artist } = await fetchRecentTrack(fmUser);
      if (error) {
        msg.channel.stopTyping();
        return this.client.util.replyEmbedMessage(msg, null, error, { fmUser });
      }
      artistName = artist;
    }
    // Check if artistName is a valid artist on Last.fm
    const {
      error,
      formattedArtistName,
      artistURL: url
    } = await fetchArtistInfo(artistName);
    if (error) {
      msg.channel.stopTyping();
      return this.client.util.replyEmbedMessage(msg, this.name, error, {
        artist: artistName
      });
    }

    const users = db.get('users').value();

    const scrobblesPerUser = [];
    for await (const { userID, fmUser } of users) {
      const { username: discordUsername } = await this.client.users.fetch(
        userID
      );
      const { userplaycount } = await fetchArtistInfo(artistName, fmUser);
      if (userplaycount > 0) {
        scrobblesPerUser.push({
          discordUsername,
          fmUser,
          playcount: Number(userplaycount)
        });
      }
    }
    if (scrobblesPerUser.length === 0) {
      msg.channel.stopTyping();
      return this.client.util.replyEmbedMessage(
        msg,
        null,
        NOT_ENOUGH_LISTENERS,
        { wkArg: artistName }
      );
    }

    const totalListeners = scrobblesPerUser.length;
    const totalScrobbles = scrobblesPerUser.reduce(
      (sum, user) => sum + user.playcount,
      0
    );
    const averageScrobbles = Math.floor(
      totalScrobbles / totalListeners
    ).toLocaleString();

    const top10Listeners = scrobblesPerUser
      .sort(this.client.util.sortTotalListeners())
      .slice(0, 10)
      .map(({ discordUsername, fmUser, playcount }, i) => {
        const usersArtistScrobbles = this.client.util.encodeURL(
          `https://www.last.fm/user/${fmUser}/library/music/${artistName}`
        );

        if (i === 0) {
          return `???? [${discordUsername}](${usersArtistScrobbles}) ??? \`${playcount.toLocaleString()} ??????\``;
        }
        return `[${discordUsername}](${usersArtistScrobbles}) ??? \`${playcount.toLocaleString()} ??????\``;
      });

    const artistURL = this.client.util.encodeURL(url);

    const listeningStatistics = `${totalListeners.toLocaleString()} listener${
      totalListeners === 1 ? '' : 's'
    } ??? ${totalScrobbles.toLocaleString()} total plays ??? ${averageScrobbles} average plays`;

    msg.channel.stopTyping();
    return msg.say(
      new MessageEmbed()
        .setTitle(`${formattedArtistName}`)
        .setURL(artistURL)
        .setDescription(top10Listeners)
        .setFooter(listeningStatistics)
        .setColor(this.client.color)
    );
  }
}
