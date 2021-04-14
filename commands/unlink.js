const Bot = require('../bot.js');

module.exports = {
    name: 'unlink',
    description: "Unlinks the playerid and the discord user.",
    execute(msg, args) {
        let discordId = msg.author.id;

        Bot.db.get("DELETE FROM users WHERE id_discord = ?", [discordId], (err, row) => {
            return msg.channel.send(`Your account has been unlinked`);
        });
    }
}