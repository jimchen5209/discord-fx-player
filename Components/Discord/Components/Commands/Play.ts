import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { SoundFxHelper } from '../SoundFxHelper';

export class PlayCommand extends SlashCommand {
    private soundFxHelper: SoundFxHelper;
    constructor(creator: SlashCreator, guildIDs: string[], soundFxHelper: SoundFxHelper) {
        super(creator, {
            name: 'play',
            description: 'Play sound',
            guildIDs,
            options: soundFxHelper.getCommandList()
        });
        this.soundFxHelper = soundFxHelper;
    }

    async run(ctx: CommandContext) {
        this.soundFxHelper.playCommand(ctx);
    }
}