import { Client } from 'eris';
import { Category } from 'logging-ts';
import { AnyRequestData, CommandContext, GatewayServer, SlashCommand, SlashCreator } from 'slash-create';
import { Core } from '../../..';
import { Config } from '../../../Core/Config';
import { AbortCommand } from './Commands/Abort';
import { FlushCommand } from './Commands/Flush';
import { PingCommand } from './Commands/Ping';
import { ReloadCommand } from './Commands/Reload';
import { PlayCommand } from './Commands/Play';
import { SoundFxHelper } from './SoundFxHelper';
import { PresistCommand } from './Commands/PresistMode';

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
            if (ctx.customID.startsWith('replay_')) {
                const commands = ctx.customID.split('_');
                this.soundFxHelper.replayCommand(ctx, commands[1], commands[2]);
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
                new PlayCommand(this.creator, guildIDs, this.soundFxHelper),
                new AbortCommand(this.creator, guildIDs, this.soundFxHelper),
                new FlushCommand(this.creator, guildIDs, this.soundFxHelper),
                new PresistCommand(this.creator, guildIDs, this.soundFxHelper),
                new ReloadCommand(this.creator, guildIDs, this)
            ];

            this.creator.registerCommands(commands);
            this.creator.syncCommands();
        });
    }

    private unregisterCommands() {
        this.logger.info('Clearing registered commands...');

        this.creator.commands.forEach(value => {
            this.creator.unregisterCommand(value);
        });

        this.creator.syncCommands();
    }

    public async reloadCommand(context: CommandContext) {
        if (!context.guildID || !context.member) return;
        if (!(this.config.discord.admins.includes(context.member.id))) {
            await context.send({
                content: 'Permission Denied',
                ephemeral: true
            });
            return;
        }
        await context.send('Clearing command registration...');
        this.unregisterCommands();
        await context.editOriginal('Reloading soundlist...');
        this.soundFxHelper.reloadSoundList();
        await context.editOriginal('Re-registering commands...');
        this.refreshCommands();
        await context.editOriginal('Done');
    }
}