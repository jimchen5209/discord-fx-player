import { Client } from 'eris';
import { Category } from 'logging-ts';
import { Config } from '../../Core/Config';
import { Core } from '../..';
import { Command } from './Components/Command';
// import { DiscordVoice } from './Components/Voice';
// import { DiscordText } from './Components/Text';
// import { mkdirSync, existsSync, rmdirSync } from 'fs';

const ERR_MISSING_TOKEN = Error('Discord token missing');

export class Discord {
    private config: Config;
    private bot: Client;
    private logger: Category;
    private command: Command;
    // public audios: { [key: string]: DiscordVoice } = {};

    constructor(core: Core) {
        this.config = core.config;
        this.logger = new Category('Discord', core.mainLogger);

        if (this.config.discord.botToken === '') throw ERR_MISSING_TOKEN;

        this.bot = new Client(
            this.config.discord.botToken,
            { restMode: true }
        );

        this.command = new Command(core,this.bot);

        this.bot.once('ready', async () => {
            this.logger.info(`Logged in as ${this.bot.user.username} (${this.bot.user.id})`);

            // this.config.discord.channels.forEach(channel => {
            //     this.audios[channel.id] = new DiscordVoice(core, this.bot, this.logger, channel);
            // });

            this.command.refreshCommands();
        });

        // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
        // new DiscordText(core, this, this.bot, this.logger);

        this.bot.connect();
    }
}
