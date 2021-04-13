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
    client.user.setActivity(`playing icebox`);
});

let userParts
let uniqueUserId



valorantApi.authorize(process.env.API_USERNAME, process.env.API_PASSWORD).then(() => {

    name = 'ptk#1407';
    userParts = name.split('#');

    request('https://api.henrikdev.xyz/valorant/v1/puuid/'+userParts[0]+'/'+userParts[1], function (error, response, body) {
        if (response.statusCode === 200) {
            uniqueUserId = JSON.parse(body).data.puuid;
            getPlayerMMR(uniqueUserId);
        } else {
            return;
        }
    });
}).catch((error) => {
    console.log(error);
    return;
})

function getPlayerMMR(playerId) {
    // get player mmr
    valorantApi.getPlayerMMR(playerId).then((response) => {
        if(response.data.LatestCompetitiveUpdate){
            const update = response.data.LatestCompetitiveUpdate;
            var elo = calculateElo(update.TierAfterUpdate, update.RankedRatingAfterUpdate);
            console.log(`Movement: ${update.CompetitiveMovement}`);
            console.log(`Current Tier: ${update.TierAfterUpdate} (${Valorant.Tiers[update.TierAfterUpdate]})`);
            console.log(`Current Tier Progress: ${update.RankedRatingAfterUpdate}/100`);
            console.log(`Total Elo: ${elo}`);
        } else {
            console.log("No competitive update available. Have you played a competitive match yet?");
        }

    });
}

function calculateElo(tier, progress) {
    if(tier >= 21) {
        return 1800 + progress
    } else {
        return ((tier * 100) - 300) + progress;
    }
}
