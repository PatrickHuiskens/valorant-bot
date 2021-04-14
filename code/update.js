const Bot = require('../bot.js');

module.exports = {
    name: 'update',
    description: "Updates the rank for all users in the DB.",
    updateRankInDB() {
        Bot.valorantApi.authorize(Bot.env.API_USERNAME, Bot.env.API_PASSWORD).then(() => {
            Bot.db.all("SELECT * FROM users", (err, rows) => {
                rows.forEach((row) => {
                    Bot.valorantApi.getPlayerCompetitiveHistory(row.id_valorant, 0, 20).then((response) => {
                        response.data.Matches.every(element => {
                            if(element.TierAfterUpdate != 0) {
                                if(element.TierAfterUpdate > row.highest_rank) {
                                    insertRankInDB(element.TierAfterUpdate, row.id_discord);
                                }
                                return false;
                            }
                            return true;
                        });
                    }).catch((error) => {
                        console.log(error);
                        return;
                    });
                });
            });
        });
    },
    updateRoleInDiscord() {

    }
}

function insertRankInDB(newRank , discordId) {
    var stmt = Bot.db.prepare("UPDATE users SET highest_rank = ? WHERE id_discord = ?");
    stmt.run(newRank, discordId);
    stmt.finalize();
}