import { Client } from 'eris';
import { Category } from 'logging-ts';
import { AnyRequestData, GatewayServer, SlashCommand, SlashCreator } from 'slash-create';
import { Core } from '../../..';
import { Config } from '../../../Core/Config';
import { PingCommand } from './Commands/Ping';

export class Command {
    private config: Config;
    private bot: Client;
    private creator: SlashCreator;
    private logger: Category;
    
    constructor(core: Core, bot: Client) {
        this.config = core.config;
        this.bot = bot;
        this.logger = new Category('Command', core.mainLogger);

        this.creator = new SlashCreator({
            applicationID: this.config.discord.applicationID,
            publicKey: this.config.discord.publicKey,
            token: this.config.discord.botToken
        });

        this.creator
            .withServer(
                new GatewayServer(
                    (handler) => this.bot.on('rawWS', event => {
                        if (event.t === 'INTERACTION_CREATE') handler(event.d as AnyRequestData);
                    })
                )
            );
    }

    public refreshCommands() {
        this.logger.info('Refreshing commands to all guilds...');

        this.bot.getRESTGuilds({ limit: 200 }).then(value => {
            const guildIDs: string[] = [];

            value.forEach(value => { guildIDs.push(value.id); });

            const commands: SlashCommand[] = [
                new PingCommand(this.creator, guildIDs)
            ];

            this.creator.registerCommands(commands);
            this.creator.syncCommands();
        });
    }
}