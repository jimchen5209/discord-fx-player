import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { SoundFxHelper } from '../SoundFxHelper';

export class SoundCommand extends SlashCommand {
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
        const firstKey = Object.keys(ctx.options)[0];
        this.soundFxHelper.playCommand(firstKey, ctx.options[firstKey].sound);
        return {
            content: 'Playing Sound...'
        };
    }
}