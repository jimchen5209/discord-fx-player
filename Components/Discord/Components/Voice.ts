import { Client, VoiceConnection } from 'eris';
import { Category } from 'logging-ts';
import Queue from 'promise-queue';

export class DiscordVoice {
    private guildId: string;
    private bot: Client;
    private voice: VoiceConnection | undefined;
    private logger: Category;
    private queue: Queue = new Queue(1, Infinity);

    constructor(bot: Client, logger: Category, guildId: string) {
        this.guildId = guildId;
        this.bot = bot;
        this.logger = logger;

        
    }
}