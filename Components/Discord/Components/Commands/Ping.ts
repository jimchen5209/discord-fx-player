import { SlashCommand, SlashCreator } from 'slash-create';

export class PingCommand extends SlashCommand {
    constructor(creator: SlashCreator, guildIDs: string[]) {
        super(creator, {
            name: 'ping',
            description: 'test',
            guildIDs
        });

        // Not required initially, but required for reloading with a fresh file.
        this.filePath = __filename;
    }

    async run() {
        return {
            content: 'Pong!',
            ephemeral: true
        };
    }
}