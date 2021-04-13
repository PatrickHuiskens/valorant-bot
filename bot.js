require('dotenv').config()

const Valorant = require('@liamcottle/valorant.js')
const valorantApi = new Valorant.API(Valorant.Regions.Europe)
const request = require('request')

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
