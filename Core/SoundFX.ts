import fs from 'fs';
import { Category } from 'logging-ts';
import { Core } from '..';

export class SoundFx {
    private command: { [key: string]: { [key: string]: string } } = {};
    private keyword: { [key: string]: string } = {};
    private logger: Category;

    constructor(core: Core) {
        this.logger = new Category('SoundFx', core.mainLogger);
        this.reload();
    }

    public getSoundCommandList() {
        return Object.keys(this.command);
    }

    public getSoundSubCommandList(command: string) {
        return Object.keys(this.command[command]);
    }


    public getSoundKeyWordList() {
        return Object.keys(this.keyword);
    }


    public getAssetFromCommand(command: string, sound: string) {
        if (!this.command[command]) return undefined;
        return this.command[command][sound];
    }

    public getAssetFromKeyWord(sound: string) {
        return this.keyword[sound];
    }


    public reload() {
        this.logger.info('Loading SoundFx...');
        if (fs.existsSync('./sound.json')) {
            const sound = JSON.parse(fs.readFileSync('./sound.json', { encoding: 'utf-8' }));
            this.command = {};
            const command = (sound.command) ? sound.command : {};
            for (const key of Object.keys(command)) {
                if (!command[key]) continue;
                this.command[key.toLowerCase()] = command[key];
            }
            this.keyword = (sound.keyword) ? sound.keyword : {};
            this.write();
        } else {
            this.logger.error('Can\'t load sound.json: File not found.', null);
            this.logger.info('Generating empty sound.json...');
            this.command = {};
            this.keyword = {};
            this.write();
        }
    }

    private write() {
        const json = JSON.stringify({
            command: this.command,
            keyword: this.keyword
        }, null, 4);
        fs.writeFileSync('./sound.json', json, 'utf8');
    }
}
