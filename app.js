const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const reCAPTCHA = require('recaptcha2');
const execFile = require('child_process').execFile;
const recaptcha = new reCAPTCHA(
    {
        siteKey: '6LdgXRAUAAAAAHBuGjFU4YCEFCk9ZsGursrDkreB',
        secretKey: '6LdgXRAUAAAAAPcvkAV4Qria_A8YpGWLye4Ek1NG'
    });

const cliFile = 'amptorcoinoracle';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',
                  'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
    next();
});

app.get('/', function (req, res) {
    res.status(404).send({ message: 'Requested url not available.' });
});

// Check Eligibility
app.post('/check-eligibility', function (req, res) {

    recaptcha.validate(req.body.reCaptcha)
        .then(function () {

            let data = req.body || { amp_address: '', ethereum_address: '' };

            let args = [
                '--eligible',
                '--btcSourceAddr', data.amp_address,
                '--ethDestAddr', data.ethereum_address
            ];

            sendCmdResponse(args, res);
        })
        .catch(function () {

            res.send({ message: 'Invalid reCaptcha request.' }, 400);
        });
});

// Transaction Status
app.post('/transaction-status', function (req, res) {

    recaptcha.validate(req.body.reCaptcha)
        .then(function () {

            let data = req.body || { receipt: '' };

            let args = [
                '--transactionstatus',
                '--receipt', data.receipt
            ];

            sendCmdResponse(args, res);
        })
        .catch(function () {

            res.send({ message: 'Invalid reCaptcha request.' }, 400);
        });

});

function sendCmdResponse(args, res) {

    res.setHeader('Content-Type', 'application/json');

    execFile('./' + cliFile, args, function (error, stdout, stderr) {

        if (stderr || error) {

            res.status(400).send({ error: error, stderr: stderr });
        } else {

            res.send(stdout);
        }
    });
}

let port = process.env.PORT || 8080;

app.listen(port, function () {
    console.log('Starting on port ' + port + '!');

    if (process.env.baseUrl) {
        console.log(process.env.baseUrl + ':' + port);
    }
});

if (process.env.ENVIRONMENT == 'production') {

    let file = __dirname + '/' + cliFile;

    let args = [
        '-c',
        'chmod +x ' + file
    ];

    console.log('Start: chmod +x ' + file);

    execFile('/bin/bash', args, { timeout: 100 }, function (error, stdout, stderr) {

        if (stderr || error) {
            console.log(error);
            console.log(stderr);
        }

        console.log('Done: chmod +x ' + file);
    });
}