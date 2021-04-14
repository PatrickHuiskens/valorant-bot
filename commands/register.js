const Bot = require('../bot.js');

module.exports = {
    name: 'register',
    description: "Registers the server in the DB.",
    execute(msg, args) {
        if(!msg.member.hasPermission("ADMINISTRATOR")) return;

        Bot.db.get("SELECT id_server FROM servers WHERE id_server = ?", [msg.guild.id], (err, row) => {
            if (row != null) {
                return msg.channel.send("Your Discord server is already registered.");
            }

            var stmt = Bot.db.prepare("INSERT INTO servers VALUES (?)");
            stmt.run(msg.guild.id);
            stmt.finalize();
        });
    }
}