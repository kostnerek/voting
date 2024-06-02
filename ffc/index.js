import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { configDotenv } from "dotenv";
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';

import formData from 'form-data';
import Mailgun from 'mailgun.js';
  
configDotenv();


const sendNotif = async (subject, text) => {
  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({username: 'api', key: process.env.MG_API_KEY});

    const mgMail = process.env.MG_MAIL;
    mg.messages.create(mgMail, {
        from: `AutoVoter <mailgun@${mgMail}>`,
        to: process.env.MAIL_TO_NOTIFY.split(','),
        subject,
        text
    })
}


const vote = async (ip, port, user, pass) => {
    puppeteer.use(StealthPlugin())
    const browser = await puppeteer.launch({
        headless: process.env.HEADLESS === 'true' ? true : false, 
        defaultViewport: {
            width: 1600,
            height: 900
        },
        args: [
            `--proxy-server=${ip}:${port}`,
          ],
    })

    const page = await browser.newPage()
    await page.authenticate({
        username: user,
        password: pass
    })
    await page.goto(process.env.VOTE_URL);

    const bandSelector = '#PDI_answer61765659'
    await page.waitForSelector(bandSelector)
    await page.click(bandSelector)

    const voteSelector = '#pd-vote-button13848454'
    await page.waitForSelector(voteSelector)
    await page.click(voteSelector)


    const resultSelector = '#question-top-13848454'
    await page.waitForSelector(resultSelector)

    const result = await page.evaluate((resultSelector) => {
        return document.querySelector(resultSelector).innerText
    }, resultSelector)

    
    browser.close()
    if(result.split(" ")[0] ==="Dzięki") {
        return true
    }
    else {
        return false
    }
}

const shuffle = (array) => {
    let currentIndex = array.length;
  
    while (currentIndex != 0) {
  
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }

const iterate = async (votesNumber) => {
    let i = 0;
    sendNotif('FFC Bot', `Voting started, ${votesNumber} votes will be added.`)
    let proxy = shuffle(process.env.PROXY.split(','))

    proxy = proxy.slice(0, votesNumber)
    const max = proxy.length;

    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: `{name} |` + colors.blue('{bar}') + '| {percentage}% || {value}/{total} ETA: {eta_formatted}',
    }, cliProgress.Presets.shades_grey);

    const main = multibar.create(max, 0, {
        name: 'Progress'
    });

    const success = multibar.create(max, 0, {
        name: 'Success '
    });

    const error = multibar.create(max, 0, {
        name: 'Error   '
    });


    let successCount = 0;
    while (i < max) {
        const proxyIp = proxy[i].split(':')[0];
        const proxyPort = proxy[i].split(':')[1];
        const proxyUser = proxy[i].split(':')[2];
        const proxyPass = proxy[i].split(':')[3];
        const result = await vote(proxyIp, proxyPort, proxyUser, proxyPass);

        if (result) {
            successCount++;
            success.increment();
        } else {
            error.increment();
        }

        i++;
        main.increment();
    }

    multibar.stop();
    console.log(`Success: ${successCount}/${max}`);
    sendNotif('FFC Bot', `Voting ended. Success: ${successCount}/${max}`)
};


import { CronJob } from 'cron';
const job = new CronJob('48 20 * * *', function() {
    iterate(2)
    console.log('a')
})
job.start()

// iterate(2)
