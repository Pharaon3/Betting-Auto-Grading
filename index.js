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
const currentDirectory = process.cwd();
const fileNames = [
  "market_rules.json",
  "footballEventData.json",
  "footballDetail.json",
];
let marketRulesData, footballEventData, footballDetailData;
fileNames.forEach((fileName) => {
  const filePath = path.join(currentDirectory, fileName);

  try {
    const data = fs.readFileSync(filePath, "utf8");
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
const getDetailData = (feedId) => {
  return footballDetailData;
}
const getEventData = (feedId) => {
  return footballEventData;
}
const getCCode = (feedId, feedEvent) => {
  return getEventData(feedId)?.d?.m[feedEvent]?.c;
};
const getValueByPath = (data, path) => {
  const keys = path.split(".");
  let value = data;

  for (const key of keys) {
    if (value.hasOwnProperty(key)) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  return value;
}
setTimeout(() => {
  console.log("wagerData:", wagerData);
  // console.log("marketRulesData:", marketRulesData);
  // console.log("footballEventData:", footballEventData);
  // console.log("footballDetailData:", footballDetailData);
  wagerData.map((row) => {
    let feedData = "" + row.feedData;
    const [feedId, feedEvent, feedSelection] = feedData.split("-");
    const detailData = getDetailData(feedId);
    const eventData = getEventData(feedId);
    const market_rules = marketRulesData;
    const cCode = getCCode(feedId, feedEvent);  // ex: "ML"
    const homeName = eventData?.d?.c1?.n.toUpperCase();
    const awayName = eventData?.d?.c2?.n.toUpperCase();
    const pCode = market_rules[row.sport]?.[cCode]?.FULL?.p ?? "";  // ex: "p.i > 249 && p.i < 256"
    const path = market_rules[row.sport]?.[cCode]?.FULL?.path ?? "";  // ex: "ps.CS.score"
    const c1 = getValueByPath(eventData?.d, path)?.c1;
    const c2 = getValueByPath(eventData?.d, path)?.c2;
    const a = eventData?.d?.m[feedEvent]?.o?.[feedSelection]?.a?.[0];
    const p = eventData?.d?.p;
    const commonCode = eventData?.d?.m[feedEvent]?.o?.[feedSelection]?.c
      .replace("$C1", homeName)
      .replace("$C2", awayName);
    const checkValue = market_rules[row.sport]?.[cCode]?.common?.[commonCode] ?? "";  // ex: "c1 > c2"
    if (checkValue && eval(pCode)) {
      if (eval(checkValue)) console.log(cCode, checkValue, "Bet Win!");
      else console.log(cCode, checkValue, "Bet Lose!");
    } else {
      console.log("Cannot grade.", cCode, checkValue);
    }
  });
}, 2000);
