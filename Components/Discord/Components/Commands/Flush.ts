import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { SoundFxHelper } from '../SoundFxHelper';

export class FlushCommand extends SlashCommand {
    private soundFxHelper: SoundFxHelper;
    constructor(creator: SlashCreator, guildIDs: string[], soundFxHelper: SoundFxHelper) {
        super(creator, {
            name: 'flush',
            description: 'Stop currently playing sound and flush the queue in this server (admin)',
            guildIDs
        });
        this.soundFxHelper = soundFxHelper;
    }

    async run(ctx: CommandContext) {
        this.soundFxHelper.flush(ctx);
    }
}