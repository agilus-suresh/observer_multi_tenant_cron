const axios = require('axios');
const moment = require('moment');
const ApiUrls = require('./apiUrls');
const Constants = require('./constansts');
const helper = require('../Utilities/helper');
const { insertMostUsesLinkPerformanceTable } = require('./databaseOperation');

class MostUsesTunnelDb {

  constructor() {
    this.tunnelSummaryQuery = {
      query: {
        condition: "AND",
        rules: [
          {
            value: ["1"],
            field: "entry_time",
            type: "date",
            operator: "last_n_hours"
          }
        ]
      },
      size: 10000
    };
    this.timestamp = helper.getTime();
  }

  async mostUsesTunnel(db,token,serverIp,sessionId) {
    try {
      let tunnelData = [];

      const headers = {
        'X-XSRF-TOKEN': token,
        'Cookie': `${sessionId}` 
      };

      // Api Urls
      const tunnelSummaryUrl = `https://${serverIp}${ApiUrls.TUNNEL_SUMMARY_URL}${JSON.stringify(this.tunnelSummaryQuery)}&limit=1000000`;
      const deviceInventoryUrl = `https://${serverIp}${ApiUrls.DEVICE_INVENTORY_URL}`;

      const tunnelSummaryJson = (await axios.get(tunnelSummaryUrl,{headers: headers})).data;
      const deviceInvJson = (await axios.get(deviceInventoryUrl,{headers: headers})).data;

      // Get current time in specific format

      let currentDate = Date.now();
      let entryDate = moment.unix(currentDate / 1000).format(Constants.ENTRY_DATE);
      // const entryDate = moment().format(Constants.ENTRY_DATE);

      for (const tunnel of tunnelSummaryJson.data) {
        let tunnelName = tunnel.name.replace('-internet', 'internet');
        const listNameParse = tunnelName.split(Constants.SPLIT_TEXT_NAME);

        // Iterate over inventory items
        let localSiteId = '', remoteSiteId = '';
        for (const inventory of deviceInvJson.data) {
          if (listNameParse[0] === inventory['system-ip']) {
            localSiteId = inventory['site-id'];
          }
          if (listNameParse[2] === inventory['system-ip']) {
            remoteSiteId = inventory['site-id'];
          }
        }

        // Tunnel statistics data
        const tunnelStatsData = {
          vmanageIp: serverIp,
          localIp: listNameParse[0],
          localSite: localSiteId,
          localColor: listNameParse[1],
          remoteIp: listNameParse[2],
          remoteSite: remoteSiteId,
          remoteColor: listNameParse[3],
          txOctet: tunnel.tx_octets,
          rxOctet: tunnel.rx_octets,
          currentTime: this.timestamp,
          entryDate: entryDate,
        };
        tunnelData.push(tunnelStatsData);
      }

      // Insert into DB
      await insertMostUsesLinkPerformanceTable(db, tunnelData);

    } catch (error) {
      console.error(`Exception in mostUsesTunnel : ${error}\n\n`);
    }
  }
}

module.exports = MostUsesTunnelDb;
