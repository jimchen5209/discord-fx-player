import { Client, Message, PossiblyUncachedTextableChannel } from 'eris';
import { Category } from 'logging-ts';
import Queue from 'promise-queue';
import { Core } from '../../..';
import { SoundFx } from '../../../Core/SoundFX';
import { DiscordVoice } from './Voice';
import { ApplicationCommandOption, ApplicationCommandOptionChoice, ButtonStyle, CommandContext, CommandOptionType, ComponentActionRow, ComponentType } from 'slash-create';

export class SoundFxHelper{
    private bot: Client;
    private soundFx: SoundFx;
    private logger: Category;
    private audios: { [key: string]: DiscordVoice } = {};

    constructor(core: Core, bot: Client) {
        this.bot = bot;
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
                content: 'You are not even in a voice channel.',
                ephemeral: true
            });
            return;
        }

        const subCommand = Object.keys(context.options)[0];
        const command = context.options[subCommand].sound;
        await context.send('Queued...', {
            components: [this.getReplayButton(subCommand, command, true)]
        });
        await this.play(context.guildID, channelId , this.soundFx.getAssetFromCommand(subCommand, command), context);
    }

    public async play(guildId: string, channelId: string, file: string, context: CommandContext | undefined = undefined) {
        if (!this.audios[guildId]) this.audios[guildId] = new DiscordVoice(this.bot, this.logger, guildId);
        const queue = this.audios[guildId].queuePlay(channelId, file, context, this);
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
}