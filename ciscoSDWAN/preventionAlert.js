const axios = require('axios');
const moment = require('moment');
const ApiUrls = require('./apiUrls');
const Constants = require('./constansts');
const helper = require('../Utilities/helper');
const { insertDataIntrusionPrevention } = require('./databaseOperation');

class IntrusionPreventionAlertSchedule {
    constructor() {
        this.intrusionPrevAlertQuery = {
            query: {
                condition: 'AND',
                rules: [
                    {
                        value: ['1'],
                        field: 'entry_time',
                        type: 'date',
                        operator: 'last_n_hours',
                    }
                ]
            },
            size: 10000
        };
        this.timestamp = helper.getTime();
    }

    async intrusionPreventionAlertSchedule(db,token,serverIp,sessionId) {
        try {

            let intrusionPrevAlertData = [];
            const intrusionPrevAlertQueryStr = JSON.stringify(this.intrusionPrevAlertQuery);

            const headers = {
                'X-XSRF-TOKEN': token,
                'Cookie': `${sessionId}` 
            };

            // API URLs
            const intrusionPrevAlertUrl = `https://${serverIp}${ApiUrls.INTRUSION_PREVENTION_ALERT_URL}${intrusionPrevAlertQueryStr}`;
            const deviceInventoryUrl = `https://${serverIp}${ApiUrls.DEVICE_INVENTORY_URL}`;

            // Making API requests
            const intrusionPrevAlertResponse = await axios.get(intrusionPrevAlertUrl,{headers: headers});
            const deviceInventoryResponse = await axios.get(deviceInventoryUrl, {headers: headers});

            const intrusionPrevAlertJson = intrusionPrevAlertResponse.data;
            const deviceInventoryJson = deviceInventoryResponse.data;

            for (let alert of intrusionPrevAlertJson.data) {
                const hostIp = alert.vdevice_name;
                let localSiteId = '';

                for (let inventory of deviceInventoryJson.data) {
                    if (hostIp === inventory['system-ip']) {
                        localSiteId = inventory['site-id'];
                    }
                }

                // Convert entry_time and stat_cycle_time to datetime format (without ms).
                let alertEntryTime = moment.unix(alert.entry_time / 1000).utcOffset(0).format(Constants.DEVICE_INVENTORY_FMT);

                // Create ips alert object
                const ipsAlert = {
                    vmanage_ip: serverIp,
                    host_name: alert.host_name,
                    host_ip: alert.vdevice_name,
                    local_site: localSiteId,
                    severity: alert.severity,
                    message: alert.message,
                    violation_path: alert.violation_path,
                    current_time: this.timestamp,
                    entry_time: alertEntryTime
                };

                intrusionPrevAlertData.push(ipsAlert);
            }
            
            // Insert data into the database
            if (intrusionPrevAlertData.length > 0) {
                await insertDataIntrusionPrevention(db, intrusionPrevAlertData);
            }

        } catch (error) {
            console.error(`Exception in intrusionPreventionAlertSchedule : ${error}`);
        }
    }
}

module.exports = IntrusionPreventionAlertSchedule;
