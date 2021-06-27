import { Client, Message, PossiblyUncachedTextableChannel } from 'eris';
// import { Category } from 'logging-ts';
import { Core } from '../../..';
import { SoundFx } from '../../../Core/SoundFX';
import { DiscordVoice } from './Voice';
import { ApplicationCommandOption, ApplicationCommandOptionChoice, CommandOptionType } from 'slash-create';

export class SoundFxHelper{
    private bot: Client;
    private soundFx: SoundFx;
    // private logger: Category;
    private audios: { [key: string]: DiscordVoice } = {};

    constructor(core: Core, bot: Client) {
        this.bot = bot;
        this.soundFx = new SoundFx(core);
        // this.logger = new Category('SoundFxHelper', core.mainLogger);
    }

    public getCommandList() {
        const list = this.soundFx.getSoundCommandList();

        const options: ApplicationCommandOption[] = [];

        list.forEach(value => {
            const soundList = this.soundFx.getSoundSubCommandList(value);

            const choice: ApplicationCommandOptionChoice[] = [];

            soundList.forEach(subValue => {
                choice.push({
                    name: subValue,
                    value: subValue
                });
            });

            options.push({
                name: value,
                description: `Play sound in ${value} group`,
                options: [{
                    name: 'sound',
                    description: 'Sound to play',
                    choices: choice,
                    type: CommandOptionType.STRING
                }],
                type: CommandOptionType.SUB_COMMAND
            });
        });

        return options;
    }
    
    public handleSoundPlay(msg: Message<PossiblyUncachedTextableChannel>) {
        if (!msg.member) return;

        msg.content.split('\n').forEach(async command => {
            this.soundFx.getSoundKeyWordList().forEach(word => {
                if (command.includes(word)) this.play(this.soundFx.getAssetFromKeyWord(word));
            });
        });
    }

    public playCommand(subcommand: string, command: string) {
        this.play(this.soundFx.getAssetFromCommand(subcommand, command));
    }

    public play(file: string) {
        console.log(file);
    }
}