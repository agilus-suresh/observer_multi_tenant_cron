const axios = require('axios');
const ApiUrls = require('./apiUrls');
const Constants = require('./constansts');
const { getTime } = require('./ciscoSdwan');
const { insertDataSdwanDeviceHealthMonitoringTable } = require('./databaseOperation');
const helper = require('../Utilities/helper');

class DownloadMonthlyUsesDevicesDb {
    static async downloadMonthlyUsesDevices(db,token,serverIp,sessionId) {
        try {
            const timestamp = helper.getTime();

            let wanDevicesData = {
                timestamp: timestamp,
                vManage: [],
                vSmart: [],
                vBond: [],
                vEdge: [],
            };

            const headers = {
                'X-XSRF-TOKEN': token,
                'Cookie': `${sessionId}` 
            };

            const deviceInventoryUrl = `https://${serverIp}${ApiUrls.DEVICE_INVENTORY_URL}`;
    
            const inventoryResp = await axios.get(deviceInventoryUrl,{headers: headers});

            for (const key of inventoryResp.data.data) {
                // Api url
                const wanHealthUrl = `https://${serverIp}${ApiUrls.WAN_HEALTH_URL}${key['system-ip']}`;
                const wanRespJson = await axios.get(wanHealthUrl, {headers: headers}).then(res => res.data);

                for (const item of wanRespJson.data) {
                    const siteId = item['host-name'].includes('vBond') ? 0 : item['site-id'];
                    const wanDevices = {
                        vmanage_ip: serverIp,
                        host_name: item['host-name'],
                        ip: item['local-system-ip'],
                        location: siteId,
                        memory_usage: item['memUsageDisplay'],
                        cpu_usage: item['cpuLoadDisplay'],
                    };

                    if (key['device-type'].includes('vmanage')) {
                        wanDevicesData.vManage.push(wanDevices);
                    } else if (key['device-type'].includes('vsmart')) {
                        wanDevicesData.vSmart.push(wanDevices);
                    } else if (key['device-type'].includes('vbond')) {
                        wanDevicesData.vBond.push(wanDevices);
                    } else if (key['device-type'].includes('vedge')) {
                        wanDevicesData.vEdge.push(wanDevices);
                    }
                }
            }

            await insertDataSdwanDeviceHealthMonitoringTable(db, wanDevicesData);

        } catch (error) {
            console.error(`Exception in downloadMonthlyUsesDevices: ${error}`);
        }
    }
}

module.exports = DownloadMonthlyUsesDevicesDb;
