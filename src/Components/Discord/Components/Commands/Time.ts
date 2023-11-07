import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';
import { SoundFxHelper } from '../SoundFxHelper';

export class TimeCommand extends SlashCommand {
    private soundFxHelper: SoundFxHelper;
    constructor(creator: SlashCreator, guildIDs: string[], soundFxHelper: SoundFxHelper) {
        super(creator, {
            name: 'time',
            description: 'Time',
            guildIDs,
            options: [
                {
                    name: 'now',
                    description: 'Play current time',
                    type: CommandOptionType.SUB_COMMAND
                }
            ]
        });
        this.soundFxHelper = soundFxHelper;
    }

    async run(ctx: CommandContext) {
        this.soundFxHelper.time(ctx);
    }
}