const Bot = require('../bot.js');
const Discord = require('discord.js');
const request = require('request');
const Tiers = require('../model/tiers.js');

module.exports = {
    name: 'rank',
    description: "Shows information about the rank of the person calling the command.",
    execute(msg, args) {
        let discordId = msg.author.id;

        Bot.db.get("SELECT id_discord, id_valorant FROM users WHERE id_discord = ?", [discordId], (err, row) => {
            if (typeof row === 'undefined') {
                return msg.channel.send(`Please add a Valorant account by using ${Bot.env.COMMAND_PREFIX} link [name#tag]`);
            }

            Bot.valorantApi.authorize(Bot.env.API_USERNAME, Bot.env.API_PASSWORD).then(() => {
                getPlayerMMR(row.id_valorant, msg);
            })
        });
    }
}

function getPlayerMMR(playerId, msg) {
    Bot.valorantApi.getPlayerCompetitiveHistory(playerId, 0, 20).then((response) => {
        let rankFound = false;

        response.data.Matches.every(element => {
            if(element.TierAfterUpdate != 0) {
                sendRank(element, msg, playerId);
                rankFound = true;
                return false;
            }
            return true;
        });

        if(!rankFound) {
            console.log("No competitive match found. Have you played a competitive match recently?");
        }
    }).catch((error) => {
        console.log(error);
        return;
    });
}

function sendRank(element, msg, playerId) {        
    let rankEmbed = new Discord.MessageEmbed()
        .addField('Current Tier:', `${Tiers[element.TierAfterUpdate]}`);
    
    if(element.TierAfterUpdate > 2) {
        let attachment = new Discord.MessageAttachment(`./resources/ranks/${element.TierAfterUpdate}.png`, 'rank.png');
        rankEmbed.attachFiles(attachment)
                 .setThumbnail('attachment://rank.png');
    }

    if(element.TierAfterUpdate >= 21){
        getLeaderboardRank(playerId).then(function(leaderboardRank) {
            rankEmbed.addField('Current Leaderboard Rank: ', `${leaderboardRank}`);
            rankEmbed.addField('Current Rating: ', `${element.RankedRatingAfterUpdate}`);
            msg.channel.send(rankEmbed);
        }).catch(function(err) {
            rankEmbed.addField('Current Leaderboard Rank: RANK_NOT_FOUND');
            rankEmbed.addField('Current Rating: ', `${element.RankedRatingAfterUpdate}`);
            msg.channel.send(rankEmbed);
        });
    } else {
        rankEmbed.addField('Current Tier Progress: ', `${element.RankedRatingAfterUpdate}/100`);
        msg.channel.send(rankEmbed);
    }
}

function getLeaderboardRank(playerid) {
    return new Promise(function(resolve, reject){
        request('https://api.henrikdev.xyz/valorant/v1/leaderboard/eu', function (error, response, body) {
            if (response.statusCode === 200) {
                let data = JSON.parse(body).data;
                let leaderboardRank;
                
                data.every(player => {
                    if(player.puuid == playerid) {
                        leaderboardRank = player.leaderboardRank;
                        return false;
                    }
                    return true;
                });

                resolve(leaderboardRank);
            } else {
                reject(error);
            }
        });
    });
}