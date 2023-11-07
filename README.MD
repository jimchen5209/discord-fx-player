# discord-fx-player

## Archived notice
As discord has released [Soundboard](https://support.discord.com/hc/en-us/articles/12612888127767-Soundboard-FAQ), this project is no longer maintained.

## How to use

1. Install [node.js](https://nodejs.org/en/) version 14 (Recommend using [nvm](https://github.com/nvm-sh/nvm)), [ffmpeg](https://ffmpeg.org/)
2. Install yarn using `npm i -g yarn`
3. Clone this repo
4. Install dependencies with `yarn`
5. Build with `yarn build:prod`
6. Run `node dist` the first time to generate `config.json`
7. Create and grab your discord bot token [here](https://discordapp.com/developers/applications/)
8. Fill `config.json`
9. Run `node dist` again to generate empty `sound.json`
10. Fill `sound.json` in following format and place your sound file into `assets/` folder
    ```json
    {
        "command": {
            "<category here>": {
                "<sound name here>": "path/to/sound/file",
            }
        },
        "keyword": {
            "<key word here>": "path/to/sound/file",
        }
    }
    ```
    For example:
    ```json
    {
        "command": {
            "random": {
                "Airhorn": "assets/airhorn.opus",
                "Doot": "assets/doot.ogg"
            },
            "meme": {
                "Illuminati": "assets/ILLUMINATI_CONFIRMED.wav",
                "Nope": "assets/Nope.mp3",
            }
        },
        "keyword": {
            "illuminati": "assets/ILLUMINATI_CONFIRMED.wav",
        }
    }
    ```
    Notice:
    - Only 25 categroy is allowed
    - Only 25 sound name is allowed in each category

11. Finally start the bot using one of the following:
    1. Run `node dist` directly
    2. Run in pm2 (recommended):
        1. Install `pm2` via `npm i -g pm2`
        2. Start the bot with `pm2 reload ecosystem.config.js`
