module.exports.splitAtFirstSpace = function (str) { 
    let i = str.indexOf(" ");

    if (i < 0) return [str];

    let part1 = str.substr(0,str.indexOf(' ')); 
    let part2 = str.substr(str.indexOf(' ')+1);

    return [part1, part2];
};