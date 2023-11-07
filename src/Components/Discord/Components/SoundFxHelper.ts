import { Client, Message, PossiblyUncachedTextableChannel } from 'eris';
import { Logger } from 'tslog-helper';
// import Queue from 'promise-queue';
import md5 from 'md5';
import fetch from 'node-fetch';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { Core } from '../../..';
import { SoundFx } from '../../../Core/SoundFX';
import { DiscordVoice } from './Voice';
import { ApplicationCommandOption, ApplicationCommandOptionChoice, ButtonStyle, CommandContext, CommandOptionType, ComponentActionRow, ComponentContext, ComponentType, MessageInteractionContext } from 'slash-create';
import { Config } from '../../../Core/Config';
import { createWriteStream, existsSync } from 'fs';

const streamPipeline = promisify(pipeline);
export class SoundFxHelper{
    private config: Config;
    private bot: Client;
    private soundFx: SoundFx;
    private logger: Logger;
    private audios: { [key: string]: DiscordVoice } = {};

    constructor(core: Core, bot: Client) {
        this.bot = bot;
        this.config = core.config;
        this.soundFx = new SoundFx(core);
        this.logger = core.mainLogger.getChildLogger({ name: 'SoundFxHelper' });
    }

    public reloadSoundList() {
        this.soundFx.reload();
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
                    required: true,
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
        if (this.soundFx.getSoundCommandList().length === 0) {
            await context.send({
                content: 'Sound list is empty.',
                ephemeral: true
            });
            return;
        }

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
        // if (context) {
        //     const refresh = (eventQueue: Queue, interactionId: string | undefined) => {
        //         if (interactionId === context.interactionID) {
        //             this.audios[guildId].removeListener('queueUpdate', refresh);
        //         } else {
        //             context.editOriginal(`Pending: ${eventQueue.getPendingLength()}/1 Queued: ${eventQueue.getQueueLength()}`);
        //         }
        //     };
        //     this.audios[guildId].on('queueUpdate', refresh);
        // }
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

    public async persist(context: CommandContext) {
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

        const option: boolean = context.options.switch;

        if (option) {
            if (!context.guildID || !context.member) return;
            const member = await this.bot.getRESTGuildMember(context.guildID, context.member.id);
            if (!member) return;
            const channelId = member.voiceState.channelID;
            if (!channelId) {
                await context.send({
                    content: 'Join a voice channel to turn on persist mode',
                    ephemeral: true
                });
                return;
            }

            if (!this.audios[context.guildID]) this.audios[context.guildID] = new DiscordVoice(this.bot, this.logger, context.guildID);
            await this.audios[context.guildID].persistSwitch(true, channelId);

            await context.send({
                content: 'Voice persist mode activated'
            });
        } else {
            if (this.audios[context.guildID]) await this.audios[context.guildID].persistSwitch(false);
            
            await context.send({
                content: 'Bot will now leave voice channel once queue is empty.'
            });
        }

    }

    public async time(context: CommandContext) {
        if (!context.guildID || !context.member) return;
        const guildId = context.guildID;
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
        await context.send('Queued...');

        if (!this.audios[guildId]) this.audios[guildId] = new DiscordVoice(this.bot, this.logger, guildId);
        const timeString = this.getTime();
        const time = await await this.getTTSFile(timeString, 'zh_TW');
        if (time != null) 
        {
            const queue = this.audios[guildId].queuePlay(channelId, time, undefined, undefined, context, this, timeString);
            context.editOriginal(`Pending: ${queue.getPendingLength()}/1 Queued: ${queue.getQueueLength()}`);
        }
    }

    private getTime(): string
    {
        const nowTime = new Date();
        const hourText = this.numberToString(nowTime.getHours(), false);
        const minuteText = this.numberToString(nowTime.getMinutes(), true);
        return `現在時刻 ${hourText}點${((nowTime.getMinutes() != 0) ? `${minuteText}分` : '整')}`;
    }

    private async getTTSFile(text: string, lang: string): Promise<string | null> {
        const filePath = `./caches/${md5(`${text}-${lang}`)}.opus`;
        if (!existsSync(filePath)) {
            const ttsURL = encodeURI(`https://translate.google.com.tw/translate_tts?ie=UTF-8&q=${text}&tl=${lang}&client=tw-ob`);
            try {
                await this.download(ttsURL, filePath);
            } catch (error) {
                if (error instanceof Error) {
                    this.logger.error(`TTS ${text} in ${lang} download failed: ${error.message}`, error);
                }
                return null;
            }
        }
        return filePath;
    }

    private async download(url: string, path: string) {
        await fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`unexpected response ${res.statusText}`);
                }

                return streamPipeline(res.body, createWriteStream(path));
            });
    }

    private numberToString(number: number, addZero: boolean): string {
        let text = (number < 0) ? '負' : '';
        const parseNumber = Math.abs(number);

        const splittedText = parseNumber.toString().split('').reverse();

        if (parseNumber >= 1000) {
            text += `${this.digitToString(splittedText[3])}千`;
        }

        if (parseNumber >= 100) {
            text += `${this.digitToString(splittedText[2])}百`;
        }

        if (parseNumber >= 10) {
            text += (splittedText[1] != '1' || parseNumber >= 100) ? `${this.digitToString(splittedText[1])}十` : '十';
            text += (splittedText[0] != '0') ? `${this.digitToString(splittedText[0])}` : '';
        } else if (parseNumber == 0) {
            text += '零';
        } else {
            text += `${(((addZero && number > 0) || parseNumber >= 100) ? '零' : '')}${this.digitToString(splittedText[0])}`;
        }

        return text;
    }

    private digitToString(digit: string): string {
        switch (digit) {
        case '0':
            return '零';
        case '1':
            return '一';
        case '2':
            return '二';
        case '3':
            return '三';
        case '4':
            return '四';
        case '5':
            return '五';
        case '6':
            return '六';
        case '7':
            return '七';
        case '8':
            return '八';
        case '9':
            return '九';
        default:
            throw Error('digit must between 0 to 9');
        }
    }
}