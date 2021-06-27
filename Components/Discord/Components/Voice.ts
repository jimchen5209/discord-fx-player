import { waitUntil } from 'async-wait-until';
// import FFmpeg from 'fluent-ffmpeg';
import { Client, VoiceConnection } from 'eris';
import EventEmitter from 'events';
import { Category } from 'logging-ts';
import Queue from 'promise-queue';
import { CommandContext } from 'slash-create';
import { SoundFxHelper } from './SoundFxHelper';

export class DiscordVoice extends EventEmitter {
    public guildId: string;
    public currentChannelId: string | undefined;
    private bot: Client;
    private voice: VoiceConnection | undefined;
    private logger: Category;
    private queue: Queue = new Queue(1, Infinity, {
        onEmpty: () => {
            if (this.currentChannelId) {
                this.bot.leaveVoiceChannel(this.currentChannelId);
                this.voice = undefined;
                this.currentChannelId = undefined;
            }
        }
    });

    constructor(bot: Client, logger: Category, guildId: string) {
        super();
        this.guildId = guildId;
        this.bot = bot;
        this.logger = logger;
    }

    public queuePlay(channelID: string, file: string, context: CommandContext | undefined = undefined, helper: SoundFxHelper | undefined = undefined) {
        this.queue.add(() => this.play(channelID, file, context, helper));
        return this.queue;
    }

    public play(channelID: string, file: string, context: CommandContext | undefined, helper: SoundFxHelper | undefined = undefined) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (res) => {
            this.emit('queueUpdate', this.queue, context?.interactionID);
            if (file === '') return;
            if (!this.voice) {
                this.voice = await this.bot.joinVoiceChannel(channelID);
                this.currentChannelId = channelID;
            }
            if (this.voice.channelID !== channelID) {
                this.voice.switchChannel(channelID);
                this.currentChannelId = channelID;
            }

            this.logger.info(`Playing ${file}`);

            if (context) context.editOriginal('Playing your requested sound...');

            await waitUntil(() => this.voice && this.voice.ready);
            this.voice.once('end', () => {
                if (context && helper) {
                    const subCommand = Object.keys(context.options)[0];
                    const command = context.options[subCommand].sound;
                    context.editOriginal('Finished playing', {
                        components: [helper.getReplayButton(subCommand, command, false)]
                    });
                }
                this.emit('queueFinish');
                res();
            });
            this.voice.play(file);
            // FFmpeg.ffprobe(file, (_, data) => {
            //     this.voice?.play(file);
            //     const time = data.format.duration || 0;
            //     setTimeout(() => {
            //         this.voice?.stopPlaying();
            //         res();
            //     }, time * 1200);
            // });
        });
    }
}