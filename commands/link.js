const Bot = require('../bot.js');
const request = require('request');

module.exports = {
    name: 'link',
    description: "Links the playerid to the discord user.",
    execute(msg, args) {
        let discordId = msg.author.id;

        Bot.db.get("SELECT id_discord FROM users WHERE id_discord = ?", [discordId], (err, row) => {
            if (typeof row !== 'undefined') {
                return msg.channel.send("Your Discord user has already been connected to a Valorant account.");
            }
        });

        linkPlayerToDiscordUser(msg, args, discordId);
    }
}

function linkPlayerToDiscordUser(msg, args, discordId) {
    Bot.valorantApi.authorize(Bot.env.API_USERNAME, Bot.env.API_PASSWORD).then(() => {
        let name = args[0];
        let userParts = name.split('#');

        request('https://api.henrikdev.xyz/valorant/v1/puuid/' + userParts[0] + '/' + userParts[1], function (error, response, body) {
            if (response.statusCode === 200) {
                let valorantId = JSON.parse(body).data.puuid;

                var stmt = Bot.db.prepare("INSERT INTO users VALUES (?, ?, NULL, ?)");
                stmt.run(discordId, valorantId, new Date().getTime());
                stmt.finalize();

                return msg.channel.send('You are succesfully connected to your Valorant account.');
            } else {
                throw 'Could not get the puuid from the player.';
            }
        });
    }).catch((error) => {
        console.log(error);
        return;
    })
}