import fs from 'fs';
import { Logger } from 'tslog-helper';
import { Core } from '..';

export class Config {
    public discord: { botToken: string, applicationID: string, publicKey: string, admins: string[] };
    public debug: boolean;
    private logger: Logger;

    constructor(core: Core) {
        this.logger = core.mainLogger.getChildLogger({ name: 'Config' });
        this.logger.info('Loading Config...');
        const discordDefaultConfig = { botToken: '', applicationID: '', publicKey: '', admins: [] };
        if (fs.existsSync('./config.json')) {
            const config = JSON.parse(fs.readFileSync('config.json', { encoding: 'utf-8' }));
            this.discord = (config.discord) ? config.discord : discordDefaultConfig;
            this.debug = (config.Debug) ? config.Debug : false;
            this.write();
        } else {
            this.logger.error('Can\'t load config.json: File not found.', null);
            this.logger.info('Generating empty config...');
            this.discord = discordDefaultConfig;
            this.debug = false;
            this.write();
            this.logger.info('Fill your config and try again.');
            process.exit(-1);
        }
    }

    private write() {
        const json = JSON.stringify({
            discord: this.discord,
            Debug: this.debug
        }, null, 4);
        fs.writeFileSync('./config.json', json, 'utf8');
    }
}
