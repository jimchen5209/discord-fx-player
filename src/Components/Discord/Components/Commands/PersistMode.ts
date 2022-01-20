import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';
import { SoundFxHelper } from '../SoundFxHelper';

export class PersistCommand extends SlashCommand {
    private soundFxHelper: SoundFxHelper;
    constructor(creator: SlashCreator, guildIDs: string[], soundFxHelper: SoundFxHelper) {
        super(creator, {
            name: 'persist',
            description: 'Changes server voice persist mode (admin)',
            guildIDs,
            options: [{
                name: 'switch',
                description: 'True: Turn persist mode on, False: Turn persist mode off',
                required: true,
                type: CommandOptionType.BOOLEAN
            }]
        });
        this.soundFxHelper = soundFxHelper;
    }

    async run(ctx: CommandContext) {
        this.soundFxHelper.persist(ctx);
    }
}