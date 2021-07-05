import { waitUntil } from 'async-wait-until';
import { Client, VoiceConnection } from 'eris';
import EventEmitter from 'events';
import { Category } from 'logging-ts';
import Queue from 'promise-queue';
import { MessageInteractionContext } from 'slash-create';
import { SoundFxHelper } from './SoundFxHelper';

export class DiscordVoice extends EventEmitter {
    public guildId: string;
    public currentChannelId: string | undefined;
    private bot: Client;
    private voice: VoiceConnection | undefined;
    private logger: Category;
    private flush = false;
    private presist = false;

    private queue: Queue = new Queue(1, Infinity, {
        onEmpty: () => {
            if (this.currentChannelId) {
                if (!this.presist) {
                    this.bot.leaveVoiceChannel(this.currentChannelId);
                    this.voice = undefined;
                    this.currentChannelId = undefined;
                }
                this.flush = false;
                this.emit('queueEmpty');
            }
        }
    });

    constructor(bot: Client, logger: Category, guildId: string) {
        super();
        this.guildId = guildId;
        this.bot = bot;
        this.logger = logger;
    }

    public queuePlay(channelID: string, file: string, subCommand: string | undefined, command: string | undefined, context: MessageInteractionContext | undefined = undefined, helper: SoundFxHelper | undefined = undefined) {
        this.queue.add(() => this.play(channelID, file, subCommand, command, context, helper));
        return this.queue;
    }

    public play(channelID: string, file: string, subCommand: string | undefined, command: string | undefined, context: MessageInteractionContext | undefined, helper: SoundFxHelper | undefined = undefined) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (res) => {
            // this.emit('queueUpdate', this.queue, context?.interactionID);
            if (file === '') return;
            if (this.flush) {
                if (context && helper && subCommand && command) {
                    context.editOriginal('Queue aborted', {
                        components: [helper.getReplayButton(subCommand, command, false)]
                    });
                }
                res();
                return;
            }
            if (!this.voice) {
                this.voice = await this.bot.joinVoiceChannel(channelID);
                this.currentChannelId = channelID;
            }
            if (this.voice.channelID !== channelID) {
                this.voice.switchChannel(channelID);
                this.currentChannelId = channelID;
            }

            this.logger.info(`Playing ${file}`);

            await waitUntil(() => this.voice && this.voice.ready);
            
            if (context) context.editOriginal('Playing your requested sound...');

            this.voice.once('end', (abort = false) => {
                if (context && helper && subCommand && command) {
                    context.editOriginal(abort? 'Aborted' : 'Finished playing', {
                        components: [helper.getReplayButton(subCommand, command, false)]
                    });
                }
                res();
            });
            this.voice.play(file);
        });
    }

    public async presistSwitch(option: boolean, channelID: string | undefined = undefined) {
        if (option && channelID) {
            this.presist = true;
            if (!this.voice) {
                this.voice = await this.bot.joinVoiceChannel(channelID);
                this.currentChannelId = channelID;
            }
        } else {
            this.presist = false;
            if (this.currentChannelId) {
                if (this.queue.getPendingLength() === 0 && this.queue.getQueueLength() === 0) {
                    this.bot.leaveVoiceChannel(this.currentChannelId);
                    this.voice = undefined;
                    this.currentChannelId = undefined;
                }
            }
        }
    }

    public abort(): boolean {
        if (this.voice && this.voice.playing) {
            this.voice.emit('end', true);
            this.voice.stopPlaying();
            return true;
        }
        return false;
    }

    public abortAll() {
        if (this.queue.getPendingLength() !== 0 || this.queue.getQueueLength() !== 0) {
            this.flush = true;
            this.voice?.emit('end', true);
            if (this.voice?.playing) this.voice?.stopPlaying();
        }
        else {
            this.emit('queueEmpty');
        }
    }
}