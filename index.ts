import { Config } from './Core/Config';
import { catService } from 'logging-ts';
import { Discord } from './Components/Discord/Core';

export class Core {
    public readonly mainLogger = catService;
    public readonly config = new Config(this);

    constructor() {
        try {
            // eslint-disable-next-line no-unused-expressions,@typescript-eslint/no-unused-expressions
            new Discord(this);
        } catch (error) {
            if (error instanceof Error) {
                this.mainLogger.error('Error occurred when connecting to discord:', error);
            }
        }
    }
}

// eslint-disable-next-line no-unused-expressions,@typescript-eslint/no-unused-expressions
new Core();
