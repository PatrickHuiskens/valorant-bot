require('dotenv').config()

// init disc
const Discord = require('discord.js');
const client = new Discord.Client();

// init valo stuff
const Valorant = require('@liamcottle/valorant.js')
const valorantApi = new Valorant.API(Valorant.Regions.Europe)
const request = require('request')

const sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('valobot.db');
db.run("CREATE TABLE IF NOT EXISTS users (id_discord TEXT NOT NULL, id_valorant TEXT NOT NULL, date_time TEXT NOT NULL UNIQUE);");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity(`icebox`);
});

let userParts

client.on('message', msg => {
    if (msg.author.bot) {
        return;
    }

    if(msg.content.substr(0, process.env.COMMAND_PREFIX.length + 9) === process.env.COMMAND_PREFIX + ' username') {
        let valorantTag = msg.content.substr(process.env.COMMAND_PREFIX.length + 10);
        let discordId = msg.author.id;

        db.get("SELECT id_discord FROM users WHERE id_discord = ?", [discordId], (err, row) => {
            // process the row here
            if (typeof row !== 'undefined') {
                return msg.channel.send("Your Discord user has already been connected to a Valorant account.");
            }
        });

        setValorantTag(valorantTag, discordId, msg);
    }

    if(msg.content.substr(0, process.env.COMMAND_PREFIX.length + 5) === process.env.COMMAND_PREFIX + ' rank') {
        let discordId = msg.author.id;

        db.get("SELECT id_discord, id_valorant FROM users WHERE id_discord = ?", [discordId], (err, row) => {
            // process the row here
            if (typeof row === 'undefined') {
                return msg.channel.send(`Please add a Valorant account by using ${process.env.COMMAND_PREFIX} username`);
            }

            valorantApi.authorize(process.env.API_USERNAME, process.env.API_PASSWORD).then(() => {
                getPlayerMMR(row.id_valorant, msg);
            })
        });
    }
})

// rename functions to set username, instead of authorize
function setValorantTag(valorantTag, discordId, msg) {
    valorantApi.authorize(process.env.API_USERNAME, process.env.API_PASSWORD).then(() => {

        name = valorantTag;
        userParts = name.split('#');

        request('https://api.henrikdev.xyz/valorant/v1/puuid/'+userParts[0]+'/'+userParts[1], function (error, response, body) {
            if (response.statusCode === 200) {
                let valorantId = JSON.parse(body).data.puuid;

                var stmt = db.prepare("INSERT INTO users VALUES (?, ?, ?)");
                stmt.run(discordId, valorantId, new Date().getTime());
                stmt.finalize();

                return msg.channel.send('You are succesfully connected to your Valorant account.');
            } else {
                return;
            }
        });
    }).catch((error) => {
        console.log(error);
        return;
    })
}

function getPlayerMMR(playerId, msg) {
    valorantApi.getPlayerCompetitiveHistory(playerId, 0, 20).then((response) => {
        response.data.Matches.every(element => {
            if(element.TierAfterUpdate != 0){
                var elo = calculateElo(element.TierAfterUpdate, element.RankedRatingAfterUpdate);
                console.log(`Current Tier: ${element.TierAfterUpdate} (${Valorant.Tiers[element.TierAfterUpdate]})`);
                console.log(`Current Tier Progress: ${element.RankedRatingAfterUpdate}/100`);
                console.log(`Total Elo: ${elo}`);
        
                let rankEmbed = new Discord.MessageEmbed()
                    .addField('Current Tier:', `${Valorant.Tiers[element.TierAfterUpdate]}`)
                    .addField('Current Tier Progress: ', `${element.RankedRatingAfterUpdate}/100`)
                    .addField('Total Elo: ', `${elo}`)
    
                msg.channel.send(rankEmbed);
                return false;
            }
            return true;
        });

        console.log("No competitive match found. Have you played a competitive match recently?");
    }).catch((error) => {
        console.log(error);
        return;
    });
}

function calculateElo(tier, progress) {
    if(tier >= 21) {
        return 1800 + progress
    } else {
        return ((tier * 100) - 300) + progress;
    }
}

client.login(process.env.DISCORD_TOKEN);