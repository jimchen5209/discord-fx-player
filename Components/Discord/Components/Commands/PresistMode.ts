import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';
import { SoundFxHelper } from '../SoundFxHelper';

export class PresistCommand extends SlashCommand {
    private soundFxHelper: SoundFxHelper;
    constructor(creator: SlashCreator, guildIDs: string[], soundFxHelper: SoundFxHelper) {
        super(creator, {
            name: 'presist',
            description: 'Changes server voice presist mode (admin)',
            guildIDs,
            options: [{
                name: 'switch',
                description: 'True: Turn presist mode on, False: Turn presist mode off',
                type: CommandOptionType.BOOLEAN
            }]
        });
        this.soundFxHelper = soundFxHelper;
    }

    async run(ctx: CommandContext) {
        this.soundFxHelper.presist(ctx);
    }
}