var CronJob = require('cron').CronJob;

new CronJob('* * * * * *', eh, null, true, 'America/Los_Angeles');

function eh()
{
    console.log("eh")
}


// var person = require('./controller').Person;
