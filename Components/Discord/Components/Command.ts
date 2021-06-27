import { Client } from 'eris';
import { Category } from 'logging-ts';
import { AnyRequestData, GatewayServer, SlashCommand, SlashCreator } from 'slash-create';
import { Core } from '../../..';
import { Config } from '../../../Core/Config';
import { PingCommand } from './Commands/Ping';
import { SoundCommand } from './Commands/Sound';
import { SoundFxHelper } from './SoundFxHelper';

export class Command {
    private config: Config;
    private bot: Client;
    private creator: SlashCreator;
    private logger: Category;
    private soundFxHelper: SoundFxHelper;
    
    constructor(core: Core, bot: Client, soundFxHelper: SoundFxHelper) {
        this.config = core.config;
        this.bot = bot;
        this.logger = new Category('Command', core.mainLogger);
        this.soundFxHelper = soundFxHelper;

        this.creator = new SlashCreator({
            applicationID: this.config.discord.applicationID,
            publicKey: this.config.discord.publicKey,
            token: this.config.discord.botToken
        });

        this.soundFxHelper.getCommandList();
        this.creator
            .withServer(
                new GatewayServer(
                    (handler) => this.bot.on('rawWS', event => {
                        if (event.t === 'INTERACTION_CREATE') handler(event.d as AnyRequestData);
                    })
                )
            );

        this.creator.on('componentInteraction', async ctx => {
            if (ctx.customID === 'example_button') {
                await ctx.editParent('You clicked a button! This will overwrite the original message!');
                await ctx.send('You clicked a button! This will reply to the original message!');
            }

            if (ctx.customID === 'button_destroy') {
                await ctx.editParent('按鈕被幹掉了', { components:[] });
            }
        });
    }

    public refreshCommands() {
        this.logger.info('Refreshing commands to all guilds...');

        this.bot.getRESTGuilds({ limit: 200 }).then(value => {
            const guildIDs: string[] = [];

            value.forEach(value => { guildIDs.push(value.id); });

            const commands: SlashCommand[] = [
                new PingCommand(this.creator, guildIDs),
                new SoundCommand(this.creator, guildIDs, this.soundFxHelper)
            ];

            this.creator.registerCommands(commands);
            this.creator.syncCommands();
        });
    }
}