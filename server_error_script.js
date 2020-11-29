"use strict";
const configSettings = require("./observerConfig");
const nodemailer = require('nodemailer');
const http = require("http");
const fs = require('fs');
var dateTime = require('node-datetime');

var schedulerConfigList;

function schedulerConfig(config)
{
    schedulerConfigList = config;
}

function sendEmailWithResult(resultMessage)
{
    let mailserverifo = nodemailer
        .createTransport(Object.assign(configSettings.mailer.transport, {}));

    let Mailinfo = Object.assign(
        configSettings.mailer.info,
        {
            "text": resultMessage
        },
    );

    if (typeof schedulerConfigList !== 'undefined') {
        if (typeof schedulerConfigList.to != 'undefined' && schedulerConfigList.to) {
            Mailinfo.to = schedulerConfigList.to;
        }

        if (typeof schedulerConfigList.cc != 'undefined' && (schedulerConfigList.cc || schedulerConfigList.cc == '')) {
            Mailinfo.cc = schedulerConfigList.cc;
        }

        if (typeof schedulerConfigList.subject != 'undefined' && schedulerConfigList.subject) {
            Mailinfo.subject = schedulerConfigList.subject;
        }


        if (typeof schedulerConfigList.text != 'undefined' && schedulerConfigList.text) {
            Mailinfo.text = schedulerConfigList.text;
        }
    }

    mailserverifo.sendMail(Mailinfo, function(error, info){
        if (error) {
            stdOut(error);
        } else {
            stdOut('Email Send Success: ' + info.response);
        }
    });

}

function stdOut(message)
{
    console.log(message);
}

var req_total = configSettings.generalConfig.req_total,
    req_per_sec = configSettings.generalConfig.req_per_sec,
    error_attempt = configSettings.generalConfig.error_attempt,
    i = 0;

let intervalID = setInterval(function timerik()  {

    if (typeof configSettings.observable_host == 'undefined') {
        stdOut('Please check the config for filling all parameters completely');
        clearInterval(intervalID); //end of Life
        return false;
    }

    var j = ++i;

    if(j == req_total){
        clearInterval(intervalID); //end of Life
    }

    http.get(configSettings.observable_host, function (response){
        if (response.statusCode !== 200) {
            response.on("data", function(chunk) {
                let dt = dateTime.create();
                let formatted = dt.format('Y-m-d_H-M-S');
                fs.appendFile("./error_body_"+formatted+".html", chunk.toString(), function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    console.log("The file was saved!");
                });
            });
            stdOut('Status not 200');
            error_attempt--;
            if(error_attempt <= 0){
                sendEmailWithResult(configSettings.observable_host +' unavailable');
                clearInterval(intervalID); //end of Life
                return false;
            }
        } else {
            var currentDate = new Date();
            stdOut('Current Time: '+currentDate.getHours()+':'+currentDate.getMinutes());
            stdOut(configSettings.observable_host +' works fine.');
            if (
                typeof configSettings.scheduler != 'undefined' &&
                typeof configSettings.scheduler.verifyHostStatus != 'undefined'
            ) {
                if (
                    typeof configSettings.scheduler.verifyHostStatus.everyday != 'undefined' &&
                    typeof configSettings.scheduler.verifyHostStatus.everyday[0] != 'undefined'
                ) {
                    var schedulerEveryday = configSettings.scheduler.verifyHostStatus.everyday;
                    schedulerEveryday.forEach(function(schedulerItem, i, arr) {
                        if (schedulerItem.state == 'on') {
                            var confHour = parseInt(schedulerItem.hour);
                            var confMinute = parseInt(schedulerItem.minute);
                            stdOut('Repeat everyday - on: at '+confHour+':'+confMinute);
                            if (
                                currentDate.getHours() == confHour  &&
                                currentDate.getMinutes() == confMinute
                            ) {
                                stdOut('executed');
                                schedulerConfig(schedulerItem);
                                sendEmailWithResult(configSettings.observable_host +' works fine');
                            }
                        }
                    });
                }
                if(
                    typeof configSettings.scheduler.verifyHostStatus.everyhour != 'undefined' &&
                    configSettings.scheduler.verifyHostStatus.everyhour.state == 'on'
                ) {
                    stdOut('Repeat everyhour - on');
                    if (currentDate.getMinutes() == 0) {
                        stdOut('executed');
                        schedulerConfig(configSettings.scheduler.verifyHostStatus.everyhour);
                        sendEmailWithResult(configSettings.observable_host +' works fine');
                    }
                }
                if(
                    typeof configSettings.scheduler.verifyHostStatus.everyminute != 'undefined' &&
                    configSettings.scheduler.verifyHostStatus.everyminute.state == 'on'
                ) {
                    stdOut('Repeat everyminute - on');
                    stdOut('executed');
                    schedulerConfig(configSettings.scheduler.verifyHostStatus.everyminute);
                    sendEmailWithResult(configSettings.observable_host +' works fine');
                }
            }
        }
        clearInterval(intervalID); //end of Life
        return true;
    }).on("error", (err) => {
        stdOut(configSettings.observable_host +' unavailable');
        sendEmailWithResult(configSettings.observable_host +' unavailable');
        clearInterval(intervalID); //end of Life
        return false;
    });

}, 1000/req_per_sec);
