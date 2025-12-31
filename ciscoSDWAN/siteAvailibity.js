const axios = require('axios');
const moment = require('moment');
const ApiUrls = require('./apiUrls');
const Constants = require('./constansts'); 
const { insertDataSdwanSiteAvailable } = require('./databaseOperation');
const helper = require('../Utilities/helper');

class SiteAvailabilityDb {

    async getBfdSiteData(serverIp, connectivityType, jsonData) {
        let wanDevicesData = [];

        // Getting current time in specific format.
        // let currentTime = moment().format(Constants.IPS_TIME_FORMAT);
        let currentTime = helper.getTime();

        jsonData.data.forEach(devices => {
            let data = {
                'vmanage_ip': serverIp,
                'system_ip': devices["local-system-ip"],
                'site_id': devices["site-id"],
                'connectivity_Status': connectivityType,
                'current_time': currentTime,
            };
            wanDevicesData.push(data);
        });
        
        return wanDevicesData;
    }

    async siteAvailability(db,token,serverIp,sessionId) {
        try {
            let timestamp = helper.getTime();

            const headers = {
                'X-XSRF-TOKEN': token,
                'Cookie': `${sessionId}` 
            };

            // Api's URLs
            const bfdSiteUpUrl = `https://${serverIp}${ApiUrls.BFD_SITE_UP_URL}`;
            const bfdSitePartialUrl = `https://${serverIp}${ApiUrls.BFD_SITE_PARTIAL_URL}`;
            const bfdSiteDownUrl = `https://${serverIp}${ApiUrls.BFD_SITE_DOWN_URL}`;

            let [bfdSiteUpJson, bfdSitePartialJson, bfdSiteDownJson] = await Promise.all([
                axios.get(bfdSiteUpUrl, {headers: headers}),
                axios.get(bfdSitePartialUrl, {headers: headers}),
                axios.get(bfdSiteDownUrl, {headers: headers})
            ]);
            
            // Merging data
            let wanDevicesData = [
                ...await this.getBfdSiteData(serverIp, 'Full WAN Connectivity', bfdSiteUpJson.data),
                ...await this.getBfdSiteData(serverIp, 'Partial WAN Connectivity', bfdSitePartialJson.data),
                ...await this.getBfdSiteData(serverIp, 'No WAN Connectivity', bfdSiteDownJson.data)
            ];

            // Insert data into db
            await insertDataSdwanSiteAvailable(db, wanDevicesData);

        } catch (error) {
            console.error(`Exception in siteAvailability : ${error}`);
            return null;
        }
    }
}

module.exports = SiteAvailabilityDb;
