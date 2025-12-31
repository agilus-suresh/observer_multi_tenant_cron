const axios = require('axios');  // For making HTTP requests
const qs = require('qs');        // For query string manipulation
const ApiUrls = require('./apiUrls');
const Constants = require('./constansts');
const { insertDataSdwanSiteWiseTopUtilizedTable } = require('./databaseOperation');
const helper = require('../Utilities/helper');

class SDWANTopUtilizedApps {

  static async topUtilizedApps(db,token,serverIp,sessionId) {
    try {
      const timestamp = helper.getTime();
      const topApps = {
        timestamp: timestamp,
        top_apps: []
      };

      const query = {
        params: {
          limit: 10,
          query: JSON.stringify({
            query: {
              rules: [
                {
                  operator: 'last_n_hours',
                  value: [24],
                  field: 'entry_time',
                  type: 'date',
                },
              ],
              condition: 'AND',
            },
          }),
        },
      } 

      const headers = {
        'x-xsrf-token': token,
        'Cookie': `${sessionId}` 
      };

      const topAppUsageUrl = `https://${serverIp}${ApiUrls.TOP_APP_USAGE_URL}`;
      const topAppUsageJson = await axios.get(topAppUsageUrl, {headers: headers,query});

      // Process the top app usage data
      topAppUsageJson.data.data.forEach(app => {
        const octetPkt = Math.round(app.octets / (1024 * 1024 * 1024) * 1000) / 1000;
        // const octetPkt = Math.round(app.octets / (1024 * 1024) * 1000) / 1000; this for mb
        const appByUsageData = {
          application: app.application,
          octet: octetPkt
        };
        topApps.top_apps.push(appByUsageData);
      });

      // Insert the data in DB
      await insertDataSdwanSiteWiseTopUtilizedTable(db, topApps);

    } catch (error) {
      console.error(`Exception in topUtilizedApps: ${error}`,error);
      return null;
    }
  }
}

module.exports = SDWANTopUtilizedApps;
