import { waitUntil } from 'async-wait-until';
import { Client, VoiceConnection } from 'eris';
import EventEmitter from 'events';
import { Logger } from 'tslog-helper';
import Queue from 'promise-queue';
import { MessageInteractionContext } from 'slash-create';
import { SoundFxHelper } from './SoundFxHelper';

export class DiscordVoice extends EventEmitter {
    public guildId: string;
    public currentChannelId: string | undefined;
    private bot: Client;
    private voice: VoiceConnection | undefined;
    private logger: Logger;
    private flush = false;
    private persist = false;

    private queue: Queue = new Queue(1, Infinity, {
        onEmpty: () => {
            if (this.currentChannelId) {
                if (!this.persist) {
                    this.bot.leaveVoiceChannel(this.currentChannelId);
                    this.voice = undefined;
                    this.currentChannelId = undefined;
                }
                this.flush = false;
                this.emit('queueEmpty');
            }
        }
    });

    constructor(bot: Client, logger: Logger, guildId: string) {
        super();
        this.guildId = guildId;
        this.bot = bot;
        this.logger = logger;
    }

    public queuePlay(channelID: string, file: string, subCommand: string | undefined, command: string | undefined, context: MessageInteractionContext | undefined = undefined, helper: SoundFxHelper | undefined = undefined, timeString: string | undefined = undefined) {
        this.queue.add(() => this.play(channelID, file, subCommand, command, context, helper, timeString));
        return this.queue;
    }

    public play(channelID: string, file: string, subCommand: string | undefined, command: string | undefined, context: MessageInteractionContext | undefined, helper: SoundFxHelper | undefined = undefined, timeString: string | undefined = undefined) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (res) => {
            // this.emit('queueUpdate', this.queue, context?.interactionID);
            if (file === '') return;
            if (this.flush) {
                if (context && helper && subCommand && command) {
                    if (timeString == undefined)
                    {
                        context.editOriginal('Queue aborted', {
                            components: [helper.getReplayButton(subCommand, command, false)]
                        });
                    }
                    else
                    {
                        context.editOriginal('Queue aborted');
                    }
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
            
            if (context) {
                if (timeString == undefined)
                {
                    context.editOriginal('Playing your requested sound...');
                }
                else
                {
                    context.editOriginal(timeString);
                }
            }

            this.once('playEnd', (abort = false) => {
                if (context && helper && subCommand && command && (timeString == undefined)) {
                    context.editOriginal(abort? 'Aborted' : 'Finished playing', {
                        components: [helper.getReplayButton(subCommand, command, false)]
                    });
                }
            });

            this.voice.once('end', () => {
                this.emit('playEnd');
                res();
            });
            this.voice.play(file);
        });
    }

    public async persistSwitch(option: boolean, channelID: string | undefined = undefined) {
        if (option && channelID) {
            this.persist = true;
            if (!this.voice) {
                this.voice = await this.bot.joinVoiceChannel(channelID);
                this.currentChannelId = channelID;
            }
        } else {
            this.persist = false;
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
            this.emit('playEnd', true);
            this.voice.stopPlaying();
            return true;
        }
        return false;
    }

    public abortAll() {
        if (this.queue.getPendingLength() !== 0 || this.queue.getQueueLength() !== 0) {
            this.flush = true;
            this.emit('playEnd', true);
            if (this.voice?.playing) this.voice?.stopPlaying();
        }
        else {
            this.emit('queueEmpty');
        }
    }
}