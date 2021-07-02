import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { SoundFxHelper } from '../SoundFxHelper';

export class AbortCommand extends SlashCommand {
    private soundFxHelper: SoundFxHelper;
    constructor(creator: SlashCreator, guildIDs: string[], soundFxHelper: SoundFxHelper) {
        super(creator, {
            name: 'abort',
            description: 'Stop currently playing sound and start next queue (if exist)',
            guildIDs
        });
        this.soundFxHelper = soundFxHelper;
    }

    async run(ctx: CommandContext) {
        this.soundFxHelper.abort(ctx);
    }
}