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
            console.log(error);
        } else {
            console.log('Email Send Success: ' + info.response);
        }
    });

}

var req_total = 10,
    req_per_sec = 10,
    error_attempt = 3,
    i = 0;

var intervalID = setInterval(function timerik()  {

    var j = ++i;

    if(j == req_total){
        clearInterval(intervalID); //end of Life
    }

    console.log(j); //write to console  task number

    http.get(configSettings.observable_host, function (response){
        console.log(response.statusCode);
        if (response.statusCode !== 200) {
            console.log('not 200');
            error_attempt--;
            if(error_attempt <= 0){
                sendEmailWithResult(configSettings.observable_host +' unavailable');
                clearInterval(intervalID); //end of Life
                return false;
            }
        } else {
            var curdate = new Date();
            console.log(configSettings.observable_host +' works fine. CurMin-'+curdate.getMinutes());
            sendEmailWithResult(configSettings.observable_host +' works fine');
            if (curdate.getMinutes() == 20) {
                sendEmailWithResult(configSettings.observable_host +' works fine');
            }
            clearInterval(intervalID); //end of Life
            return true;
        }
    }).on("error", (err) => {
        console.log(configSettings.observable_host +' unavailable');
        sendEmailWithResult(configSettings.observable_host +' unavailable');
        clearInterval(intervalID); //end of Life
        return false;
    });

}, 1000/req_per_sec);
