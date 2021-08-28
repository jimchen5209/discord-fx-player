import { Config } from './Core/Config';
import { catService } from 'logging-ts';
import { Discord } from './Components/Discord/Core';
import { Status } from 'status-client';

export class Core {
    public readonly mainLogger = catService;
    public readonly config = new Config(this);
    private readonly status = new Status('fx-player');

    constructor() {
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
