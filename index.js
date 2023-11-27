const axios = require("axios");
const { DOMParser } = require("xmldom");

let wagerData = [];
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

    console.log("newRows: ", newRows);
  })
  .catch((error) => {
    console.log(error);
  });
