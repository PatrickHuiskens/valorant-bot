// init dependencies
require('dotenv').config()
const fs = require('fs');
const Discord = require('discord.js');
const Valorant = require('@liamcottle/valorant.js')
const sqlite3 = require('sqlite3').verbose();
const StringUtil = require('./utils/string.js');
const Update = require('./code/update.js');

// init disc
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// init valo api
const valorantApi = new Valorant.API(Valorant.Regions.Europe)

// init db
const db = new sqlite3.Database('valobot.db');
db.run("CREATE TABLE IF NOT EXISTS users (id_discord TEXT NOT NULL, id_valorant TEXT NOT NULL, highest_rank TEXT NULL, date_time TEXT NOT NULL);");
db.run("CREATE TABLE IF NOT EXISTS servers (id_server TEXT NOT NULL UNIQUE);");

// init env variables
const env = process.env;

// export global variables
module.exports.db = db;
module.exports.valorantApi = valorantApi;
module.exports.env = env;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity(`icebox`);

    setInterval(function () {
        Update.updateRankInDB();
        Update.updateRoleInDiscord();
     }, 60 * 60 * 1000);
});

client.on('message', msg => {
    if (!msg.content.startsWith(env.COMMAND_PREFIX) || msg.author.bot) return;

    const args = StringUtil.splitAtFirstSpace(msg.content.slice(env.COMMAND_PREFIX.length + 1));
    const command = args.shift().toLowerCase();

    client.commands.get(command).execute(msg, args);
})

client.login(env.DISCORD_TOKEN);