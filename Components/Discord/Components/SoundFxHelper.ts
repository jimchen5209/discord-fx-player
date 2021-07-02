import { Client, Message, PossiblyUncachedTextableChannel } from 'eris';
import { Category } from 'logging-ts';
import Queue from 'promise-queue';
import { Core } from '../../..';
import { SoundFx } from '../../../Core/SoundFX';
import { DiscordVoice } from './Voice';
import { ApplicationCommandOption, ApplicationCommandOptionChoice, ButtonStyle, CommandContext, CommandOptionType, ComponentActionRow, ComponentContext, ComponentType, MessageInteractionContext } from 'slash-create';
import { Config } from '../../../Core/Config';

export class SoundFxHelper{
    private config: Config;
    private bot: Client;
    private soundFx: SoundFx;
    private logger: Category;
    private audios: { [key: string]: DiscordVoice } = {};

    constructor(core: Core, bot: Client) {
        this.bot = bot;
        this.config = core.config;
        this.soundFx = new SoundFx(core);
        this.logger = new Category('SoundFxHelper', core.mainLogger);
    }

    public getCommandList() {
        const list = this.soundFx.getSoundCommandList();

        const options: ApplicationCommandOption[] = [];

        list.forEach(value => {
            const soundList = this.soundFx.getSoundSubCommandList(value);

            const choice: ApplicationCommandOptionChoice[] = [];

            soundList.forEach(subValue => {
                choice.push({
                    name: subValue,
                    value: subValue
                });
            });

            options.push({
                name: value,
                description: `Play sound in ${value} group`,
                options: [{
                    name: 'sound',
                    description: 'Sound to play',
                    choices: choice,
                    type: CommandOptionType.STRING
                }],
                type: CommandOptionType.SUB_COMMAND
            });
        });

        return options;
    }
    
    public handleSoundPlay(msg: Message<PossiblyUncachedTextableChannel>) {
        if (!msg.guildID ||!msg.member) return;

        const channelId = msg.member.voiceState.channelID;
        if (channelId) {
            msg.content.split('\n').forEach(async command => {
                this.soundFx.getSoundKeyWordList().forEach(word => {
                    if (!msg.guildID) return;
                    if (command.includes(word)) this.play(msg.guildID, channelId, this.soundFx.getAssetFromKeyWord(word));
                });
            });
        }
    }

    public getReplayButton(subCommand: string, command: string, disabled: boolean) {
        return {
            type: ComponentType.ACTION_ROW,
            components: [{
                type: ComponentType.BUTTON,
                style: ButtonStyle.PRIMARY,
                label: 'Replay',
                disabled,
                custom_id: `replay_${subCommand}_${command}`
            }
            ]
        } as ComponentActionRow;
    }

    public async playCommand(context: CommandContext) {
        if (!context.guildID || !context.member) return;
        const member = await this.bot.getRESTGuildMember(context.guildID, context.member.id);
        if (!member) return;
        const channelId = member.voiceState.channelID;
        if (!channelId) {
            await context.send({
                content: 'You are not even in a voice channel',
                ephemeral: true
            });
            return;
        }

        const subCommand = Object.keys(context.options)[0];
        const command = context.options[subCommand].sound;

        const sound = this.soundFx.getAssetFromCommand(subCommand, command);

        if (!sound) {
            await context.send({
                content: 'Invalid sound',
                ephemeral: true
            });
            return;
        }

        await context.send('Queued...', {
            components: [this.getReplayButton(subCommand, command, true)]
        });
        await this.play(context.guildID, channelId, sound, subCommand, command, context);
    }

    public async replayCommand(context: ComponentContext, subCommand: string, command: string ) {
        if (!context.guildID || !context.member) return;
        const member = await this.bot.getRESTGuildMember(context.guildID, context.member.id);
        if (!member) return;
        const channelId = member.voiceState.channelID;
        if (!channelId) {
            await context.send({
                content: 'Join a voice channel to replay',
                ephemeral: true
            });
            return;
        }

        const sound = this.soundFx.getAssetFromCommand(subCommand, command);

        if (!sound) {
            await context.editOriginal('Sound is no longer valid', { components: [] });
            return;
        }

        await context.editOriginal('Queued...', {
            components: [this.getReplayButton(subCommand, command, true)]
        });


        await this.play(context.guildID, channelId, sound, subCommand, command, context);
    }

    public async play(guildId: string, channelId: string, file: string, subCommand: string | undefined = undefined, command: string | undefined = undefined, context: MessageInteractionContext | undefined = undefined) {
        if (!this.audios[guildId]) this.audios[guildId] = new DiscordVoice(this.bot, this.logger, guildId);
        const queue = this.audios[guildId].queuePlay(channelId, file, subCommand, command, context, this);
        if (context) {
            context.editOriginal(`Pending: ${queue.getPendingLength()}/1 Queued: ${queue.getQueueLength()}`);
        }
        if (context) {
            const refresh = (eventQueue: Queue, interactionId: string | undefined) => {
                if (interactionId === context.interactionID) {
                    this.audios[guildId].removeListener('queueUpdate', refresh);
                } else {
                    context.editOriginal(`Pending: ${eventQueue.getPendingLength()}/1 Queued: ${eventQueue.getQueueLength()}`);
                }
            };
            this.audios[guildId].on('queueUpdate', refresh);
        }
    }
    
    public async abort(context: CommandContext) {
        if (!context.guildID || !context.member) return;
        if (!this.audios[context.guildID]) {
            await context.send({
                content: 'Bot\'s not currently playing',
                ephemeral: true
            });
            return;
        }
        else
        {
            if (this.audios[context.guildID].abort()) {
                await context.send({
                    content: 'Sound has been stopped'
                });
            }
            else {
                await context.send({
                    content: 'Bot\'s not currently playing',
                    ephemeral: true
                });
            }
        }
    }

    public async flush(context: CommandContext) {
        if (!context.guildID || !context.member) return;
        const member = await this.bot.getRESTGuildMember(context.guildID, context.member.id);
        if (!member) return;
        if (!(member.permissions.has('administrator')) && !(this.config.discord.admins.includes(member.id))) {
            await context.send({
                content: 'Permission Denied',
                ephemeral: true
            });
            return;
        }
        if (!this.audios[context.guildID]) {
            await context.send({
                content: 'No queue record for this server',
                ephemeral: true
            });
            return;
        }
        else {
            await context.send({
                content: 'Flushing the queue...'
            });
            this.audios[context.guildID].once('queueEmpty', () => context.editOriginal('Done'));
            this.audios[context.guildID].abortAll();
        }
    }
}