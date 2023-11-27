const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { DOMParser } = require("xmldom");

let wagerData = [];
let market_rules = [];
let soccerEventArray = [];
let soccerDetail = [];
let config = {
  method: "get",
  maxBodyLength: Infinity,
  url: "https://ezlivebet.com/service/koz.asmx/GetPendingWagers?id=1",
  headers: {},
};

axios
  .request(config)
  .then((response) => {
    const xmlString = response.data;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const text = xmlDoc.documentElement.textContent;
    const resArray = text.split("^");

    const newRows = resArray.map((row) => {
      const [
        wagerID,
        sport,
        league,
        eventName,
        market,
        selectedOption,
        betPlaced,
        scorewhen,
        halfWhen,
        eventTimer,
        feedData,
      ] = row.split("|");

      return {
        wagerID: wagerID,
        sport: sport,
        league: league,
        eventName: eventName,
        market: market,
        selectedOption: selectedOption,
        betPlaced: betPlaced,
        scorewhen: scorewhen,
        halfWhen: halfWhen,
        eventTimer: eventTimer,
        feedData: feedData,
      };
    });
    wagerData = newRows;
    // console.log("newRows: ", newRows);
  })
  .catch((error) => {
    console.log(error);
  });
// Get the current directory
const currentDirectory = process.cwd();

// Specify the file names
const fileNames = [
  "market_rules.json",
  "footballEventData.json",
  "footballDetail.json",
];

// Variables to store the data
let marketRulesData, footballEventData, footballDetailData;

// Read each specified JSON file
fileNames.forEach((fileName) => {
  const filePath = path.join(currentDirectory, fileName);

  try {
    // Read the file synchronously to simplify the example
    const data = fs.readFileSync(filePath, "utf8");

    // Parse the JSON data and store in the corresponding variable
    if (fileName === "market_rules.json") {
      marketRulesData = JSON.parse(data);
    } else if (fileName === "footballEventData.json") {
      footballEventData = JSON.parse(data);
    } else if (fileName === "footballDetail.json") {
      footballDetailData = JSON.parse(data);
    }
  } catch (readError) {
    console.error(`Error reading or parsing ${fileName}:`, readError);
  }
});

setTimeout(() => {
  console.log("wagerData:", wagerData);
  console.log("marketRulesData:", marketRulesData);
  console.log("footballEventData:", footballEventData);
  console.log("footballDetailData:", footballDetailData);
}, 2000);
