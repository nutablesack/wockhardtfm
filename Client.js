import { CommandoClient } from 'discord.js-commando';
import Utilities from './src/structures/Utilities';
import path from 'path';
import {
  PREFIX,
  default_prefix,
  EMBED_COLOR,
  OWNERS,
  DISCORD_BOT_TOKEN
} from './config.json';

export default class LastyClient extends CommandoClient {
  constructor() {
    super({
      commandPrefix: PREFIX,
      commandPrefix: default_prefix,
      owner: OWNERS.split(',').map(id => id.trim()),
      disableMentions: 'everyone'
    });

    this.color = EMBED_COLOR;
    this.util = Utilities;
  }

  init() {
    this.registry
      .registerDefaultTypes()
      .registerGroups([
        ['lastfm', 'Last.fm'],
        ['util', 'Util']
      ])
      
      
      .registerCommandsIn(path.join(__dirname, './src/commands/'));

    this.on('ready', () => require('./src/events/ready')(this));

    this.login(DISCORD_BOT_TOKEN);
  }
}
