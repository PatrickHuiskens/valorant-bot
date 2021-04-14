require('dotenv').config()

// init static list
const Tiers = require('./tiers.js');

// init disc
const Discord = require('discord.js');
const client = new Discord.Client();

// init valo stuff
const Valorant = require('@liamcottle/valorant.js')
const valorantApi = new Valorant.API(Valorant.Regions.Europe)
const request = require('request')

const sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('valobot.db');
db.run("CREATE TABLE IF NOT EXISTS users (id_discord TEXT NOT NULL, id_valorant TEXT NOT NULL, highest_rank TEXT NULL, date_time TEXT NOT NULL UNIQUE);");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity(`icebox`);
});

let userParts

client.on('message', msg => {
    if (msg.author.bot) {
        return;
    }

    let usernameCommand = ' username';
    if(msg.content.substr(0, process.env.COMMAND_PREFIX.length + usernameCommand.length) === process.env.COMMAND_PREFIX + usernameCommand) {
        let valorantTag = msg.content.substr(process.env.COMMAND_PREFIX.length + usernameCommand.length + 1);
        let discordId = msg.author.id;

        db.get("SELECT id_discord FROM users WHERE id_discord = ?", [discordId], (err, row) => {
            // process the row here
            if (typeof row !== 'undefined') {
                return msg.channel.send("Your Discord user has already been connected to a Valorant account.");
            }
        });

        setValorantTag(valorantTag, discordId, msg);
    }

    let rankCommand = ' rank';
    if(msg.content.substr(0, process.env.COMMAND_PREFIX.length + rankCommand.length) === process.env.COMMAND_PREFIX + rankCommand) {
        let discordId = msg.author.id;

        db.get("SELECT id_discord, id_valorant FROM users WHERE id_discord = ?", [discordId], (err, row) => {
            // process the row here
            if (typeof row === 'undefined') {
<<<<<<< HEAD
                return msg.channel.send(`Please add a Valorant account by using ${process.env.COMMAND_PREFIX} ${usernameCommand} [username]`);
=======
                return msg.channel.send(`Please add a Valorant account by using ${process.env.COMMAND_PREFIX} username [name#tag]`);
>>>>>>> bb6fe9c33b34abc03eaab1a98351baf72d71b02e
            }

            valorantApi.authorize(process.env.API_USERNAME, process.env.API_PASSWORD).then(() => {
                getPlayerMMR(row.id_valorant, msg);
            })
        });
    }

    let unlinkCommand = ' unlink';
    if(msg.content.substr(0, process.env.COMMAND_PREFIX.length + unlinkCommand.length) === process.env.COMMAND_PREFIX + unlinkCommand) {
        let discordId = msg.author.id;

        db.get("DELETE FROM users WHERE id_discord = ?", [discordId], (err, row) => {
            return msg.channel.send(`Your account has been unlinked`);
        });
    }
})

// rename functions to set username, instead of authorize
function setValorantTag(valorantTag, discordId, msg) {
    valorantApi.authorize(process.env.API_USERNAME, process.env.API_PASSWORD).then(() => {

        name = valorantTag;
        userParts = name.split('#');

        request('https://api.henrikdev.xyz/valorant/v1/puuid/' + userParts[0] + '/' + userParts[1], function (error, response, body) {
            if (response.statusCode === 200) {
                let valorantId = JSON.parse(body).data.puuid;

                var stmt = db.prepare("INSERT INTO users VALUES (?, ?, NULL, ?)");
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
        let rankFound = false;

        response.data.Matches.every(element => {
            if(element.TierAfterUpdate != 0) {
                sendRank(element, msg);
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

function sendRank(element, msg) {        
    let rankEmbed = new Discord.MessageEmbed()
        .addField('Current Tier:', `${Tiers[element.TierAfterUpdate]}`);
    
    if(element.TierAfterUpdate >= 21){
        rankEmbed.addField('Current Rating: ', `${element.RankedRatingAfterUpdate}`)
    } else {
        rankEmbed.addField('Current Tier Progress: ', `${element.RankedRatingAfterUpdate}/100`)
    }

    if(element.TierAfterUpdate > 2) {
        let attachment = new Discord.MessageAttachment(`./resources/ranks/${element.TierAfterUpdate}.png`, 'rank.png');
        rankEmbed.attachFiles(attachment)
                 .setThumbnail('attachment://rank.png');
    }

    msg.channel.send(rankEmbed);
}

client.login(process.env.DISCORD_TOKEN);