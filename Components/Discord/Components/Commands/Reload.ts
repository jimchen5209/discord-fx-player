import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { Command } from '../Command';

export class ReloadCommand extends SlashCommand {
    private command: Command;
    constructor(creator: SlashCreator, guildIDs: string[], command: Command) {
        super(creator, {
            name: 'reload',
            description: 'Reload guild commands and sound list (Bot Admin)',
            guildIDs
        });
        this.command = command;
    }

    async run(ctx: CommandContext) {
        this.command.reloadCommand(ctx);
    }
}