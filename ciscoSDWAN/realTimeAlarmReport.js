const axios = require('axios');
const moment = require('moment');
const ApiUrls = require('./apiUrls');
const Constants = require('./constansts'); 
const helper = require('../Utilities/helper');
const { insertDataSdwanAlarmTableRealTime } = require('./databaseOperation');

class DownloadAlarmReportForRealTimeStatus {
    constructor() {
        this.realTimeAlarmQuery = {
            "query": {
                "condition": "AND",
                "rules": [
                    {
                        "value": ["6"],
                        "field": "entry_time",
                        "type": "date",
                        "operator": "last_n_hours"
                    }
                ]
            },
            "size": 10000
        };
    }

    async downloadAlarmReportForRealTimeStatus(db,token,serverIp,sessionId) {
        try {
            // Timestamp logic to avoid timezone issues
            const timestamp = helper.getTime();
            const currentHour = timestamp.getHours();
            let timeLabel = "12:00 pm - 06:00 pm";

            if (currentHour === 0) {
                timeLabel = "06:00 pm - 12:00 am";
            } else if (currentHour === 6) {
                timeLabel = "12:00 am - 06:00 am";
            } else if (currentHour === 12) {
                timeLabel = "06:00 am - 12:00 pm";
            }

            const realTimeAlarmReportsData = {
                "Critical": [],
                "Major": [],
                "Medium": [],
                "Minor": [],
                "timestamp": timestamp,
                "time_label": timeLabel,
            };

            const headers = {
                'X-XSRF-TOKEN': token,
                'Cookie': `${sessionId}` 
            };

            const alarmsQuery = JSON.stringify(this.realTimeAlarmQuery);
            const alarmsUrl = `https://${serverIp}${ApiUrls.ALARMS_URL}${alarmsQuery}`;
            const deviceInventoryUrl = `https://${serverIp}${ApiUrls.DEVICE_INVENTORY_URL}`;

            const alarmsResponse = await axios.get(alarmsUrl, {headers: headers});
            const deviceInventoryResponse = await axios.get(deviceInventoryUrl, {headers: headers});

            const currentTime = timestamp //moment().format(Constants.IPS_TIME_FORMAT);
            const alarmsJson = alarmsResponse.data;
            const deviceInventoryJson = deviceInventoryResponse.data;

            for (const alarm of alarmsJson.data) {
                let localSiteId = '';

                for (const inventory of deviceInventoryJson.data) {
                    if (alarm.values[0]['host-name'] && alarm.values[0]['host-name'].includes('vBond')) {
                        localSiteId = "---";
                    } else if (alarm.devices[0]['system-ip'] === inventory['system-ip']) {
                        localSiteId = inventory['site-id'];
                    }
                }

                // Convert receive_time and entry_time to datetime format
                const alarmReceiveTime = moment.unix(alarm.receive_time / 1000).format(Constants.TOPOLOGY_TIME_FORMAT);
                const alarmEntryTime = moment.unix(alarm.entry_time / 1000).format(Constants.TOPOLOGY_TIME_FORMAT);

                // Create real-time alarm data dict
                const realTimeAlarmDict = {
                    vmanage_ip: serverIp,
                    id: alarm.id,
                    host_name: alarm.values[0]['host-name'] || '',
                    system_ip: alarm.devices[0]['system-ip'],
                    alarm_id: alarm.id,
                    alarm_status: alarm.active,
                    severity: alarm.severity,
                    severity_number: alarm.severity_number,
                    event_name: alarm.eventname,
                    component: alarm.component,
                    message: alarm.message,
                    type: alarm.type,
                    uuid: alarm.uuid,
                    acknowledged: alarm.acknowledged,
                    active: alarm.active,
                    site_id: localSiteId,
                    receive_time: alarmReceiveTime,
                    current_time: currentTime,
                    last_updated_time: alarmEntryTime,
                };

                // Append data to the list
                realTimeAlarmReportsData[alarm.severity].push(realTimeAlarmDict);
            }

            // Insert data into DB
            await insertDataSdwanAlarmTableRealTime(db, realTimeAlarmReportsData);

        } catch (error) {
            // logger.error(`Exception occurred in schedulers/overseer/jobs - download_alarm_report_for_real_time_status function: ${error.message}`);
            console.error(`Exception in downloadAlarmReport: ${error}`);
            return null;
        }
    }
}

module.exports = DownloadAlarmReportForRealTimeStatus;
