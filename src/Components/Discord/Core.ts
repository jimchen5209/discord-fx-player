import { Client } from 'eris';
import { Logger } from 'tslog-helper';
import { Config } from '../../Core/Config';
import { Core } from '../..';
import { Command } from './Components/Command';
import { DiscordText } from './Components/Text';
import { SoundFxHelper } from './Components/SoundFxHelper';

const ERR_MISSING_TOKEN = Error('Discord token missing');

export class Discord {
    private config: Config;
    private bot: Client;
    private logger: Logger;
    private command: Command;
    private soundFxHelper: SoundFxHelper;

    constructor(core: Core) {
        this.config = core.config;
        this.logger = core.mainLogger.getChildLogger({ name: 'Discord' });
        if (this.config.discord.botToken === '') throw ERR_MISSING_TOKEN;

        this.bot = new Client(
            this.config.discord.botToken,
            { restMode: true, intents: ['guilds', 'guildIntegrations', 'guildMessages', 'guildVoiceStates', 'guildMembers'] }
        );

        this.soundFxHelper = new SoundFxHelper(core, this.bot);

        this.command = new Command(core, this.bot, this.soundFxHelper);

        this.bot.once('ready', async () => {
            this.logger.info(`Logged in as ${this.bot.user.username} (${this.bot.user.id})`);

            this.command.refreshCommands();
        });

        // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
        new DiscordText(this.soundFxHelper, this.bot, this.logger);

        this.bot.connect();
    }
}
