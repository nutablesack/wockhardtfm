import { MessageEmbed } from 'discord.js';
import dayjs from 'dayjs';
import db from '../db';
import getCronData from '../utils/getCronData';
import { ERROR } from '../constants';

async function weeklyStatCron(client) {
  const users = db.get('users').value();
  users.forEach(async user => {
    const { userID, fmUser, isSubscribedWeekly } = user;
    if (!isSubscribedWeekly) return;
    const {
      topArtists,
      topAlbums,
      topTracks,
      lastFMAvatar,
      weeklyScrobbles,
      error
    } = await getCronData(fmUser);
    if (error) {
      return client.users
        .fetch(userID)
        .then(user =>
          user.send(
            client.util.createEmbedMessage(
              ERROR,
              `Weekly Recap was unsuccessful.\n**${fmUser}** is not a registered Last.fm user or listening data is unavailable.`
            )
          )
        );
    }

    const now = dayjs().format('M/D');
    const lastWeek = dayjs()
      .subtract(7, 'day')
      .format('M/D');

    client.users
      .fetch(userID)
      .then(user => {
        user.send(
          new MessageEmbed()
            .setTitle(`:musical_note: Weekly Recap (${lastWeek} - ${now})`)
            .setAuthor(
              `Last.fm | ${fmUser}`,
              lastFMAvatar,
              `https://last.fm/user/${fmUser}`
            )
            .setDescription(`Scrobbles • \`${weeklyScrobbles} ▶️\``)
            .setColor(client.color)
        );
        user.send(
          new MessageEmbed()
            .setTitle('**:man_singer: Top Artists**')
            .setDescription(topArtists)
            .setColor(client.color)
        );
        user.send(
          new MessageEmbed()
            .setTitle('**:cd: Top Albums**')
            .setDescription(topAlbums)
            .setColor(client.color)
        );
        user.send(
          new MessageEmbed()
            .setTitle('**:repeat: Top Tracks**')
            .setDescription(topTracks)
            .setColor(client.color)
        );
      })
      .catch(err => {
        console.log(err);
      });
  });
}

export default weeklyStatCron;
