import { Config } from './Core/Config';
import { LogHelper } from 'tslog-helper';
import { Discord } from './Components/Discord/Core';
import { Status } from 'status-client';
import { existsSync, mkdirSync } from 'fs';

export class Core {
    private readonly logHelper = new LogHelper();
    public readonly mainLogger = this.logHelper.logger;
    public readonly config = new Config(this);
    private readonly status = new Status('fx-player');

    constructor() {
        if (!existsSync('./caches')) mkdirSync('./caches');

        try {
            // eslint-disable-next-line no-unused-expressions,@typescript-eslint/no-unused-expressions
            new Discord(this);
        } catch (error) {
            if (error instanceof Error) {
                this.mainLogger.error('Error occurred when connecting to discord:', error);
            }
        }
        this.status.set_status();
    }
}

// eslint-disable-next-line no-unused-expressions,@typescript-eslint/no-unused-expressions
new Core();
