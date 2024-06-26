const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { DOMParser } = require("xmldom");
const xml2js = require('xml2js');
const stringSimilarity = require("string-similarity");

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

// axios
//   .request(config)
//   .then((response) => {
//     const xmlString = response.data;
//     const parser = new DOMParser();
//     const xmlDoc = parser.parseFromString(xmlString, "text/xml");
//     const text = xmlDoc.documentElement.textContent;
//     const resArray = text.split("^");

//     const newRows = resArray.map((row) => {
//       const [
//         wagerID,
//         sport,
//         league,
//         eventName,
//         market,
//         selectedOption,
//         betPlaced,
//         scorewhen,
//         halfWhen,
//         eventTimer,
//         feedData,
//       ] = row.split("|");

//       return {
//         wagerID: wagerID,
//         sport: sport,
//         league: league,
//         eventName: eventName,
//         market: market,
//         selectedOption: selectedOption,
//         betPlaced: betPlaced,
//         scorewhen: scorewhen,
//         halfWhen: halfWhen,
//         eventTimer: eventTimer,
//         feedData: feedData,
//       };
//     });
//     wagerData = newRows;
//     // console.log("newRows: ", newRows);
//   })
//   .catch((error) => {
//     console.log(error);
//   });
fs.readFile('response.xml', 'utf-8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  xml2js.parseString(data, (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    const xmlData = result;
    const text = xmlData?.anyType?._;
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
  });
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
const getDetailData = (course) => {
  return footballDetailData;
}
const getEventData = (feedId) => {
  return footballEventData;
}
const getMarketCode = (eventData, feedMarket) => {
  return eventData?.d?.m[feedMarket]?.c;
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
const getCountByType = (counttype, detailData) => {
  let count = 0;
  for(let i = 0; i < detailData?.d?.events?.length; i ++){
    let currentEvent = detailData?.d?.events[i];
    let type = currentEvent?.type
    if(type == counttype)
      count += 1
  }
  return count;
}
const getFirstByType = (firsttype, detailData) => {
  for(let i = 0; i < detailData?.d?.events?.length; i ++){
    let currentEvent = detailData?.d?.events[i];
    let type = currentEvent?.type
    if(type == firsttype){
      return currentEvent
    }
  }
  return None;
}

const getEndByType = (firsttype, detailData) => {
  for(let i =  detailData?.d?.events?.length-1; i >= 0; i--){
    let currentEvent = detailData?.d?.events[i];
    let type = currentEvent?.type
    if(type == firsttype){
      return currentEvent
    }
  }
  return None;
}

setTimeout(() => {
  // console.log("wagerData:", wagerData);
  // console.log("marketRulesData:", marketRulesData);
  // console.log("footballEventData:", footballEventData);
  // console.log("footballDetailData:", footballDetailData);
  let unGradedWagers = [];
  wagerData.map((row) => {
    let feedData = "" + row.feedData;
    const [feedId, feedMarket, feedMarketOption] = feedData.split("-"); // feedMarket = 1,
    const market_rules = marketRulesData;
    if(market_rules[row.sport]) {
      const detailData = getDetailData(feedId);
      const eventData = getEventData(feedId);
      let marketCode = getMarketCode(eventData, feedMarket);  // ex: "ML/H:2"
      let period = "";
      let isDetail = false;
      let source = "";
      let compareScore = 0;
      let c0_number;
      let reverse = false;
      if(row.sport == "Soccer") {
        period = "FULL";
        if(marketCode && marketCode.includes("/H")) {
          period = "H" + marketCode.split("/H:")[1];
        }
        marketCode = marketCode?.split("/H:")[0];
        if(marketCode && marketCode.includes("/TOTAL")) {
          compareScore = parseFloat(marketCode.split("/TOTAL:")[1]);
          marketCode = marketCode?.split("/TOTAL:")[0] + "/TOTAL";
        }
        if(marketCode && marketCode.includes("/C:")) {
          c0_number = parseFloat(marketCode.split("/C:")[1]);
          marketCode = marketCode?.split("/C:")[0];
        }
        if(marketCode && marketCode.includes("_EXTRA_TIME")){
          marketCode = marketCode?.split("_EXTRA_TIME")[0];
          period = "ET"
        }
        isDetail = market_rules?.[row.sport][marketCode]?.[period]?.isDetail;
        source = market_rules?.[row.sport][marketCode]?.[period]?.source?.replace("EVENT_ID", feedId);
        check = market_rules?.[row.sport][marketCode]?.[period]?.check;
        reverse = market_rules?.[row.sport][marketCode]?.[period]?.reverse;
      } else if (row.sport == "Basketball") {
        period = "FULL";
        if(marketCode && marketCode.includes("/Q")) {
          period = "Q" + marketCode.split("/Q:")[1];
        }
        marketCode = marketCode?.split("/Q:")[0];
        isDetail = market_rules?.[row.sport][marketCode]?.period?.isDetail;
        source = market_rules?.[row.sport][marketCode]?.[period]?.source.replace("EVENT_ID", feedId);
        check = market_rules?.[row.sport][marketCode]?.[period]?.check;
      }
      if(market_rules[row.sport]?.[marketCode]){
        // console.log("period: ", period);
        const market = market_rules[row.sport]?.[marketCode];
        if(period){
          const homeName = eventData?.d?.c1?.n;
          const awayName = eventData?.d?.c2?.n;
          const pCode = market_rules[row.sport]?.[marketCode]?.[period]?.p ?? "";  // ex: "p.i > 249 && p.i < 256"
          const path = market_rules[row.sport]?.[marketCode]?.[period]?.path ?? "";  // ex: "ps.CS.score"
          let c1, c2, c0, periodc1, periodc2, firstteam, lastteam, count;
          
          let detailData = "";
          detailData = getDetailData(source);
          let getDetailData_count = 5;
          while(getDetailData_count){
            if(detailData)
              break
            else{
              setTimeout(() => {
                detailData = getDetailData(source)
              }, 500)
            }
            getDetailData_count--;
          }
          
          const homeNameFromDetail = detailData?.d?.match?.teams?.home?.name;
          const awayNameFromDetail = detailData?.d?.match?.teams?.away?.name;
          // console.log("Home, Away Name from Event Data: ", homeName, awayName);
          // console.log("Home, Away Name from Detail Data: ", homeNameFromDetail, awayNameFromDetail);
          var matchesHome = stringSimilarity.findBestMatch(homeName, [
            homeNameFromDetail,
            awayNameFromDetail,
          ]);
          var matchesAway = stringSimilarity.findBestMatch(awayName, [
            homeNameFromDetail,
            awayNameFromDetail,
          ]);
          // console.log("matchesHome: ", matchesHome);
          // console.log("matchesAway: ", matchesAway);
          let isReverseFalse = matchesHome.ratings[0].rating + matchesAway.ratings[1].rating;
          let isReverseTrue = matchesHome.ratings[1].rating + matchesAway.ratings[0].rating;
          if(isReverseTrue > isReverseFalse) reverse = true;
          else reverse = false;
          console.log("reverse: ", reverse);
          // console.log("isReverseTrue: ", isReverseTrue);
          // console.log("isReverseFalse: ", isReverseFalse);
          // console.log("reverse: ", reverse);
          if(isDetail){
            count = 0;
            let countType = market_rules?.[row.sport][marketCode]?.[period]?.counttype
            let firstType = market_rules?.[row.sport][marketCode]?.[period]?.firsttype
            let endType = market_rules?.[row.sport][marketCode]?.[period]?.endtype
            if(countType){
              count = getCountByType(countType, detailData)
            }
            if(firstType){
              let firstElement = getFirstByType(firstType, detailData)
              if(firstElement){
                firstteam = firstElement.team
              }
              else firstteam = "No Goal"
            }
            if(endType){
              let endElement = getEndByType(endType, detailData)
              if(endElement){
                lastteam = endElement.team
              }
              else lastteam = "No Goal"
            }
            for(let i = 0; i < detailData?.d?.events?.length; i ++){
              let currentEvent = detailData?.d?.events[i];
              let type = currentEvent?.type,
                  name = currentEvent?.name,
                  periodscore = currentEvent?.periodscore;
              if(eval(check)) {
                eval(market_rules?.[row.sport][marketCode]?.[period]?.scores);
              }
            }
            if(reverse){
              let tempC1 = c1;
              c1 = c2;
              c2 = tempC1;
            } else {
            }
          } else {
            c1 = getValueByPath(eventData?.d, path)?.c1;
            c2 = getValueByPath(eventData?.d, path)?.c2;
            c1_H1 = getValueByPath(eventData?.d, "ps.1.score")?.c1;
            c2_H1 = getValueByPath(eventData?.d, "ps.1.score")?.c2;
            let scoreWhen = row.scorewhen.split("-")
            periodc1 = parseInt(scoreWhen[0])
            periodc2 = parseInt(scoreWhen[1])
            if(reverse){
              let tempC1 = c1;
              c1 = c2;
              c2 = tempC1;
              let tempC1H1 = c1_H1;
              c1_H1 = c2_H1;
              c2_H1 = tempC1H1;
            } else {
            }
          }
          if(c0_number == 1) {
            c0 = c1;
          } else if (c0_number == 2) {
            c0 = c2;
          }
          const a = eventData?.d?.m[feedMarket]?.o?.[feedMarketOption]?.a?.[0];
          const p = eventData?.d?.p;  // "p": { "i": 255, "c": "", "n": "END"}
          const cl = eventData?.d?.cl;  // "cl": { "m": 90, "s": 29, "r": 0 }
          let homeNameRegex = new RegExp(homeName.toUpperCase(), "gi");
          let awaynameRegex = new RegExp(awayName.toUpperCase(), "gi");
          let commonCode = eventData?.d?.m[feedMarket]?.o?.[feedMarketOption]?.c  // ex: EVEN, 1, O, U, Y, N, 
            .replace(homeNameRegex, "$C1")
            .replace(awaynameRegex, "$C2");  // ex: 1
          if(compareScore) {
            commonCode = commonCode.replace("_" + compareScore, "");
          }
          const checkValue = market_rules[row.sport]?.[marketCode]?.common?.[commonCode] ?? "";  // ex: "c1 > c2"
          if (checkValue && eval(pCode)) {
            console.log();
            console.log("C0, C1, C2, A, compareScore, periodC1, periodC2, count, firstteam, lastteam, C1_H1, C2_H1: ", c0, c1, c2, a, compareScore, periodc1, periodc2, count, firstteam, lastteam, c1_H1, c2_H1);
            if (eval(checkValue)) console.log(marketCode, checkValue, "Bet Win!");
            else console.log(marketCode, checkValue, "Bet Lose!");
          } else {
            // console.log("Cannot grade.", marketCode, checkValue);
            unGradedWagers.push(row);
          }
        } else {
          // console.log("This wager cannot be grade for now.");
          unGradedWagers.push(row);
        }
      } else if (1) {
        // console.log("something happend");
      } else {
        // console.log(row.sport + " in market rules doesn't have " + marketCode);
        unGradedWagers.push(row);
      }
      
    } else {
      // console.log("Market Rule doesn't have " + row.sport);
      unGradedWagers.push(row);
    }
  });
}, 2000);
