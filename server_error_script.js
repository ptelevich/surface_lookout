"use strict";
const configSettings = require("./observerConfig");
const nodemailer = require('nodemailer');
const http = require("http");

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

var req_total = 10,
    req_per_sec = 10,
    error_attempt = 3,
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
                typeof configSettings.scheduler.verifyTheScript != 'undefined' &&
                typeof configSettings.scheduler.verifyTheScript.repeat != 'undefined'
            ) {
                var confHour = parseInt(configSettings.scheduler.verifyTheScript.hour);
                var confMinute = parseInt(configSettings.scheduler.verifyTheScript.minute);
                stdOut('Repeat: '+configSettings.scheduler.verifyTheScript.repeat+' at '+confHour+':'+confMinute);
                if (configSettings.scheduler.verifyTheScript.repeat === 'everyday') {
                    if (
                        currentDate.getHours() == confHour  &&
                        currentDate.getMinutes() == confMinute
                    ) {
                        sendEmailWithResult(configSettings.observable_host +' works fine');
                    }
                }
            }
            clearInterval(intervalID); //end of Life
            return true;
        }
    }).on("error", (err) => {
        stdOut(configSettings.observable_host +' unavailable');
        sendEmailWithResult(configSettings.observable_host +' unavailable');
        clearInterval(intervalID); //end of Life
        return false;
    });

}, 1000/req_per_sec);
