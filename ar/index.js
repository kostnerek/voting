import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { configDotenv } from "dotenv";
configDotenv();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

let proxies = process.env.PROXY.split(',');

proxies = shuffle(proxies)



const msToTime = (s) => {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return hrs + ':' + mins + ':' + secs + '.' + ms;
}

function generateTimeOffsets(targetSum, percentageDiff, size) {
  if (size <= 0) return []    
  let baseValue = targetSum / size;
  let array = Array(size).fill(baseValue);
  
  for (let i = 0; i < size; i++) {
      if (i % 2 === 0) {
          array[i] *= (1 + Math.random() * percentageDiff / 100);
      } else {
          array[i] *= (1 - Math.random() * percentageDiff / 100);
      }
  }
  
  let currentSum = array.reduce((acc, val) => acc + val, 0);
  let correctionFactor = targetSum / currentSum;
  array = array.map(x => Math.floor(x * correctionFactor));
  
  return array;
}

let targetSum = 1000000;
let percentageDiff = 80;
let size = 15;


const run = async (targetSum, percentageDiff, size) => {
    const timeOffsets = generateTimeOffsets(targetSum, percentageDiff, size);
    console.log("Whole time: ", msToTime(targetSum));
    for (let i = 0; i < size; i++) {
        const proxyUrl = `http://scmookux:dj4civ5uiu6p@${proxies[i]}`;
        try {
            await callApi(proxyUrl);
            console.log(`Proxy ${proxyUrl} worked`);
        } catch (e) {
            console.log(`Proxy ${proxyUrl} failed`);
        }
        console.log(`Sleeping for ${msToTime(timeOffsets[i])} HH:MM:SS.MS`);
        await sleep(timeOffsets[i]);
    }
}

const callApi = async (proxyUrl) => {
    const agent = new HttpsProxyAgent(proxyUrl);
    const response = await axios.post(
        process.env.URL,
        new URLSearchParams({
          'id': '5344',
          'group': '304',
          'first_name': '',
          'email': '',
          'phone': ''
        }),
        {
          agent,
          headers: {
            'authority': `${process.env.AUTHORITY_URL}`,
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'accept-language': 'en-US,en;q=0.9,pl;q=0.8,fr-FR;q=0.7,fr;q=0.6',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'origin': `${process.env.ORIGIN_URL}`,
            'referer': `${process.env.REFERER_URL}`,
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Opera";v="106"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Linux"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
            'x-requested-with': 'XMLHttpRequest'
          }
        }
      );
    console.log(response.data);
}
run(targetSum, percentageDiff, size);

