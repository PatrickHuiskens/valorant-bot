const Bot = require('../bot.js');

module.exports = {
    name: 'help',
    description: "Shows information about all commands.",
    execute(msg, args) {
        msg.channel.send('List of available commands:\n'  + 
        Bot.env.COMMAND_PREFIX + ' help -> Shows information about all commands.\n'  + 
        Bot.env.COMMAND_PREFIX + ' link [name#tag] -> Links the playerid to the discord user.\n'  + 
        Bot.env.COMMAND_PREFIX + ' unlink -> Unlinks the playerid and the discord user.\n'  + 
        Bot.env.COMMAND_PREFIX + ' rank -> Shows information about the rank of the person calling the command.\n');
    }
}