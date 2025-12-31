const axios = require("axios");
const qs = require('qs');
const helpers = require("../Utilities/helper");
const ApiUrls = require("./apiUrls");
const { DateTime } = require('luxon');
const { insertSdwanHardwareHealth, insertSdwanDeviceInventory, insertSdwanSiteHealth, insert_data_sdwan_link_performance_table, insertDataSdwanAlarmTable } = require("./databaseOperation");
const Constants = require("./constansts");
const helper = require('../Utilities/helper')
const moment = require('moment');
exports.getSessionId = async(packageData)=>{
    try{
        const password = helpers.decrypt(packageData.SDWANPassword,helpers.KeyPhrase);
        let data = qs.stringify({
                'j_username': packageData.SDWANUsername,
                'j_password': password 
            });
    
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `https://${packageData.SDWANUrl}${ApiUrls.J_SECURITY_CHECK_URL}`,
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
               data : data
            };
    
            let response = await axios.request(config)
            let cookies = response.headers['set-cookie'];
            let sessionId = cookies[0].split(';')[0];
            return sessionId;

    }catch(error){
        console.log("error in getSessionId : ",error);
        return "";
    }
}

exports.getSdwanToken = async(packageData,sessionId)=>{
    try{
        const url = `https://${packageData.SDWANUrl}${ApiUrls.TOKEN_URL}`;
        const password = helpers.decrypt(packageData.SDWANPassword,helpers.KeyPhrase);
        
        let data = qs.stringify({
            'j_username': packageData.SDWANUsername,
            'j_password': password 
        });

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: url,
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': `${sessionId}` 
            },
            data : data
        };

        const response = await axios.request(config);
        // console.log("response In token : ",response.data);
        return response.data;
        
    }catch(error){
        console.log("error in getSdwanToken : ",error);
    }
}

exports.sdwanHardwareHealth = async(db,token,ip,sessionId)=> {
    try {
    
        const headers = {
            'X-XSRF-TOKEN': token,
            'Cookie': `${sessionId}` 
        };

        // API URLs
        const hardwareHealthUrl = `https://${ip}${ApiUrls.HARDWARE_HEALTH_URL}`;

        // Call API to get hardware health data
        const hardwareHealthResponse = await axios.get(hardwareHealthUrl,{headers: headers});
        const hardwareHealthJson = hardwareHealthResponse.data;
        const vedgeCount = hardwareHealthJson.data[0].count;

        const timestamp = helper.getTime();
        let hardwareHealth = {
            timestamp: timestamp,
            normal: 0,
            warning: 0,
            error: 0
        };
        let hardwareCount = {
            normal: 0,
            warning: 0,
            error: 0
        };

        if (vedgeCount) {
            hardwareHealthJson.data.forEach((key) => {
                key.statusList.forEach((status) => {
                    if (status.name === 'normal') {
                        hardwareHealth.normal = Math.round((status.count / vedgeCount) * 1000) / 10;
                        hardwareCount.normal = status.count;
                    }
                    if (status.name === 'warning') {
                        hardwareHealth.warning = Math.round((status.count / vedgeCount) * 1000) / 10;
                        hardwareCount.warning = status.count;
                    }
                    if (status.name === 'error') {
                        hardwareHealth.error = Math.round((status.count / vedgeCount) * 1000) / 10;
                        hardwareCount.error = status.count;
                    }
                });
            });
        }

        // Inserting data into DB
        hardwareHealth.count = hardwareCount;
        hardwareHealth.total = vedgeCount;
        const resultDb = await insertSdwanHardwareHealth(db, hardwareHealth);

    } catch (error) {
        console.error(`Exception traceback is: ${error}`);
    }
}

exports.sdwanDeviceInventory = async(db,token,ip,sessionId)=> {
  try {    
    // Timestamp logic to avoid timezone differences
    const timestamp = helper.getTime();

    const deviceCount = {
      vmanage: 0,
      vsmart: 0,
      vbond: 0,
      vedge: 0,
    };

    const inventoryData = {
      timestamp: timestamp,
      vmanage: { reachable: [], unreachable: [] },
      vsmart: { reachable: [], unreachable: [] },
      vbond: { reachable: [], unreachable: [] },
      vedge: { reachable: [], unreachable: [] },
    };

    const headers = {
        'X-XSRF-TOKEN': token,
        'Cookie': `${sessionId}` 
    };
    
    // API url
    const deviceInventoryUrl = `https://${ip}${ApiUrls.DEVICE_INVENTORY_URL}`;
    
    const inventoryJson = await axios.get(deviceInventoryUrl,{headers: headers});

    // Loop through the inventory JSON and categorize devices
    inventoryJson.data.data.forEach((key) => {
      if (key['device-type'].includes('vmanage')) {
        if (key.reachability === 'reachable') {
          inventoryData.vmanage.reachable.push(key);
        } else {
          inventoryData.vmanage.unreachable.push(key);
        }
        deviceCount.vmanage++;
      }
      if (key['device-type'].includes('vsmart')) {
        if (key.reachability === 'reachable') {
          inventoryData.vsmart.reachable.push(key);
        } else {
          inventoryData.vsmart.unreachable.push(key);
        }
        deviceCount.vsmart++;
      }
      if (key['device-type'].includes('vbond')) {
        if (key.reachability === 'reachable') {
          inventoryData.vbond.reachable.push(key);
        } else {
          inventoryData.vbond.unreachable.push(key);
        }
        deviceCount.vbond++;
      }
      if (key['device-type'].includes('vedge')) {
        if (key.reachability === 'reachable') {
          inventoryData.vedge.reachable.push(key);
        } else {
          inventoryData.vedge.unreachable.push(key);
        }
        deviceCount.vedge++;
      }
    });

    inventoryData.count = deviceCount;
    // Inserting data into DB
    await insertSdwanDeviceInventory(db, inventoryData);
    
  } catch (error) {
    // logger.error(`Exception occurred in schedulers/overseer/jobs - sdwanDeviceInventory function: ${ex}`);
    console.error(`Error in sdwanDeviceInventory : ${error}`);
    // return null;
  }
}

exports.sdwanSiteHealth = async(db,token,serverIp,sessionId)=> {
    try {
        
        const timestamp = helper.getTime();

        const siteHealth = {
            timestamp: timestamp,
            full_wan_connectivity: [],
            partial_wan_connectivity: [],
            no_wan_connectivity: [],
        };

        const siteCount = {
            full_wan: 0,
            partial_wan: 0,
            no_wan: 0,
        };

        const headers = {
            'X-XSRF-TOKEN': token,
            'Cookie': `${sessionId}` 
        };

        // API URLs
        const siteHealthUrl = `https://${serverIp}${ApiUrls.BFD_SITE_SUMMARY_URL}`;
        const bfdSiteUpUrl = `https://${serverIp}${ApiUrls.BFD_SITE_UP_URL}`;
        const bfdSitePartialUrl = `https://${serverIp}${ApiUrls.BFD_SITE_PARTIAL_URL}`;
        const bfdSiteDownUrl = `https://${serverIp}${ApiUrls.BFD_SITE_DOWN_URL}`;

        // Making API requests using axios
        const [siteHealthJson, bfdSiteUpJson, bfdSitePartialJson, bfdSiteDownJson] = await Promise.all([
            axios.get(siteHealthUrl, {headers: headers}),
            axios.get(bfdSiteUpUrl, {headers: headers}),
            axios.get(bfdSitePartialUrl, {headers: headers}),
            axios.get(bfdSiteDownUrl, {headers: headers})
        ]);

        // Update siteHealth object with data from API responses
        siteHealth.full_wan_connectivity = bfdSiteUpJson.data.data;
        siteHealth.partial_wan_connectivity = bfdSitePartialJson.data.data;
        siteHealth.no_wan_connectivity = bfdSiteDownJson.data.data;

        // Process site count from siteHealthJson
        siteHealthJson.data.data.forEach(item => {
            if (item.statusList[0].name.includes('Full WAN Connectivity')) {
                siteCount.full_wan = item.statusList[0].count;
            }
            if (item.statusList[1].name.includes('Partial WAN Connectivity')) {
                siteCount.partial_wan = item.statusList[1].count;
            }
            if (item.statusList[2].name.includes('No WAN Connectivity')) {
                siteCount.no_wan = item.statusList[2].count;
            }
        });

        // Insert data into DB
        siteHealth.site_count = siteCount;
        await insertSdwanSiteHealth(db, siteHealth);

    } catch (error) {
        // logger.error(`Exception occurred in schedulers/overseer/jobs - sdwan_site_health function: ${error.message}`);
        console.error(`Exception in sdwanSiteHealth : ${error}`);
        // return null;
    }
}

const approute_tunnel_query = {
    "query": {
        "condition": "AND",
        "rules": [
            {
                "value": ["1"],
                "field": "entry_time",
                "type": "date",
                "operator": "last_n_hours"
            }
        ]
    },
    "size": 10000
};

const approute_aggregation_query = {
    "query": {
        "condition": "AND",
        "rules": [
            {
                "value": ["1"],
                "field": "entry_time",
                "type": "date",
                "operator": "last_n_hours"
            }
        ]
    },
    "aggregation": {
        "field": [
            {
                "property": "name",
                "sequence": 1,
                "size": 1000
            }
        ],
        "metrics": [
            {
                "property": "latency",
                "type": "max"
            },
            {
                "property": "jitter",
                "type": "max"
            },
            {
                "property": "loss_percentage",
                "type": "max"
            }
        ]
    }
};

exports.downloadMonthlyUsesTunnel = async(db,token,serverIp,sessionId)=> {
    try {
        const tunnelQuery = JSON.stringify(approute_tunnel_query);
        const aggregationQuery = JSON.stringify(approute_aggregation_query);
        const timestamp = helper.getTime();

        await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep 1 second (similar to time.sleep(1))

        const headers = { 
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': token,
            'Cookie': `${sessionId}` 
        };
        let wanDevicesData = [];

        const tunnelUrl = `https://${serverIp}${ApiUrls.TUNNEL_SUMMARY_URL}${tunnelQuery}&limit=1000000`;
        const inventoryUrl = `https://${serverIp}${ApiUrls.DEVICE_INVENTORY_URL}`;
        const approuteStatsUrl = `https://${serverIp}${ApiUrls.APP_ROUTE_STATISTICS_URL}`;

    
        const tunnelRespJson = await axios.get(tunnelUrl, {headers: headers});
        const inventoryRespJson = await axios.get(inventoryUrl, {headers: headers});
        const approuteRespJson = await axios.post(approuteStatsUrl, aggregationQuery, {headers: headers});

        const maxParam = {};
        for (let item of approuteRespJson.data.data) {
            maxParam[item.name] = {
                max_jitter: item.jitter,
                max_loss: item.loss_percentage,
                max_latency: item.latency
            };
        }

        let currentDate = Date.now();
        let entryDate = moment.unix(currentDate / 1000).format(Constants.ENTRY_DATE);
        // const entryDate = DateTime.now().toFormat(Constants.ENTRY_DATE);

        for (let tunnel of tunnelRespJson.data.data) {
            let tunnelName = tunnel.name.replace('-internet', 'internet');
            const listNameParse = tunnelName.split(Constants.SPLIT_TEXT_NAME);

            let localSiteId = '';
            let remoteSiteId = '';
            for (let inventory of inventoryRespJson.data.data) {
                if (listNameParse[0] === inventory["system-ip"]) {
                    localSiteId = inventory["site-id"];
                }
                if (listNameParse[2] === inventory["system-ip"]) {
                    remoteSiteId = inventory["site-id"];
                }
            }

            const devices = {
                vmanage_ip: serverIp,
                local_ip: listNameParse[0],
                local_site: localSiteId,
                local_color: listNameParse[1],
                remote_ip: listNameParse[2],
                remote_site: remoteSiteId,
                remote_color: listNameParse[3],
                jitter: tunnel.jitter,
                latency: tunnel.latency,
                loss_percentage: tunnel.loss_percentage,
                max_jitter: maxParam[tunnel.name].max_jitter,
                max_loss: maxParam[tunnel.name].max_loss,
                max_latency: maxParam[tunnel.name].max_latency,
                rx_octets: tunnel.rx_octets,
                tx_octets: tunnel.tx_octets,
                entry_date: entryDate,
                current_time: timestamp
            };
            wanDevicesData.push(devices);
        }

        const dbResult = await insert_data_sdwan_link_performance_table(db, wanDevicesData);

    } catch (error) {
        console.error(`Exception in downloadMonthlyUsesTunnel : ${error}`);
    }
}

const alarmQuery = {
    "query": {
        "condition": "AND",
        "rules": [
            {
                "value": ["true"],
                "field": "active",
                "type": "date",
                "operator": "equal"
            },
            {
                "value": ["1"],
                "field": "entry_time",
                "type": "date",
                "operator": "last_n_hours"
            }
        ]
    },
    "size": 10000
};

exports.downloadOpenAlarmReport = async(db,token,serverIp,sessionId)=> {
    try {
        
        const alarmReportsData = [];
        const timestamp = helpers.getTime();
        const alarmsQuery = JSON.stringify(alarmQuery);
        const headers = { 
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': token,
            'Cookie': `${sessionId}` 
        };

        // Api's urls.
        const alarmsUrl = `https://${serverIp}${ApiUrls.ALARMS_URL}${alarmsQuery}`;
        const deviceInventoryUrl = `https://${serverIp}${ApiUrls.DEVICE_INVENTORY_URL}`;

        const alarmsJson = await axios.get(alarmsUrl,{headers: headers});
        const deviceInventoryJson = await axios.get(deviceInventoryUrl, {headers: headers});

        // const currentTimeStr = moment().format(Constants.IPS_TIME_FORMAT_SEC);
        // const currentTime = moment(currentTimeStr, Constants.IPS_TIME_FORMAT_SEC);

        for (const alarm of alarmsJson.data.data) {
            let localSiteId = '';
            for (const inventory of deviceInventoryJson.data.data) {
                if (alarm.values[0]["host-name"].includes('vBond')) {
                    localSiteId = 0;
                } else if (alarm.devices[0]["system-ip"] === inventory["system-ip"]) {
                    localSiteId = inventory["site-id"];
                }
            }

            // Convert alarm receive_time to a datetime format
            let receiveTime = moment.unix(alarm.receive_time / 1000).utcOffset(0).format(Constants.COMMAN_TIME_FORMAT);

            const alarmsDict = {
                vmanage_ip: serverIp,
                alarm_id: alarm.id,
                severity: alarm.severity,
                host_name: alarm.values[0]["host-name"],
                system_ip: alarm.devices[0]["system-ip"],
                current_time: timestamp,
                receive_time: receiveTime,
            };

            // Appending data to alarmReportsData list.
            alarmReportsData.push(alarmsDict);
        }
        if(alarmReportsData.length > 0){
            await insertDataSdwanAlarmTable(db, alarmReportsData);
        }
        // await insertDataSdwanAlarmTable(db, alarmReportsData);

    } catch (error) {
        // console.error(`Exception occurred in schedulers/overseer/jobs - download_open_alarm_report function:  ${ex}`);
        console.error(`Exception in downloadOpenAlarmReport : ${error}`);
        return null;
    }
}
