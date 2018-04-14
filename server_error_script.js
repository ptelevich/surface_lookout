"use strict";
const configSettings = require("./observerConfig");
const nodemailer = require('nodemailer');
const http = require("http");

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

    if (typeof schedulerConfigList.to != 'undefined' && schedulerConfigList.to) {
        Mailinfo.to = schedulerConfigList.to;
    }

    if (typeof schedulerConfigList.cc != 'undefined' && schedulerConfigList.cc) {
        Mailinfo.cc = schedulerConfigList.cc;
    }

    if (typeof schedulerConfigList.subject != 'undefined' && schedulerConfigList.subject) {
        Mailinfo.subject = schedulerConfigList.subject;
    }


    if (typeof schedulerConfigList.text != 'undefined' && schedulerConfigList.text) {
        Mailinfo.text = schedulerConfigList.text;
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

var intervalID = setInterval(function timerik()  {

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
                    configSettings.scheduler.verifyHostStatus.everyday.state == 'on'
                ) {
                    var confHour = parseInt(configSettings.scheduler.verifyHostStatus.everyday.hour);
                    var confMinute = parseInt(configSettings.scheduler.verifyHostStatus.everyday.minute);
                    stdOut('Repeat everyday: at '+confHour+':'+confMinute);
                    if (
                        currentDate.getHours() == confHour  &&
                        currentDate.getMinutes() == confMinute
                    ) {
                        schedulerConfig(configSettings.scheduler.verifyHostStatus.everyday);
                        stdOut('Each day');
                        sendEmailWithResult(configSettings.observable_host +' works fine');
                    }
                }
                if(
                    typeof configSettings.scheduler.verifyHostStatus.everyhour != 'undefined' &&
                    configSettings.scheduler.verifyHostStatus.everyhour.state == 'on'
                ) {
                    if (currentDate.getMinutes() == 0) {
                        schedulerConfig(configSettings.scheduler.verifyHostStatus.everyhour);
                        stdOut('Each hour');
                        sendEmailWithResult(configSettings.observable_host +' works fine');
                    }
                }
                if(
                    typeof configSettings.scheduler.verifyHostStatus.everyminute != 'undefined' &&
                    configSettings.scheduler.verifyHostStatus.everyminute.state == 'on'
                ) {
                    schedulerConfig(configSettings.scheduler.verifyHostStatus.everyminute);
                    stdOut('Each minute');
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
