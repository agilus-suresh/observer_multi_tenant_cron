const axios = require('axios');
const moment = require('moment');
const ApiUrls = require('./apiUrls');
const Constants = require('./constansts');
const { insertSdwanSiteTopology } = require('./databaseOperation');
const helper = require('../Utilities/helper');

class SDWANTopology {
    constructor() {
        this.topologyDict = {
            timestamp: '',
            nodes: [],
            links: []
        };
        this.num = -1;
    }

    async devicesLinks(url, data,headers) {
        for (const key of data.data) {
            const ip = key['system-ip'];
            const fullUrl = url + ip;
            try {
                const response = await axios.get(fullUrl, {headers:headers});
                const jsonStringTopology = response.data;

                if (jsonStringTopology.data) {
                    for (const link of jsonStringTopology.data) {
                        const infoLinks = {};

                        for (const node of this.topologyDict.nodes) {
                            if (node.ip) {
                                if (link['vdevice-name'] === node.ip) {
                                    infoLinks['source'] = node.id;
                                }
                                if (link['system-ip'] === node.ip) {
                                    infoLinks['target'] = node.id;
                                }
                                infoLinks['Connection'] = link['vdevice-dataKey'];
                            }
                        }

                        this.topologyDict.links.push(infoLinks);
                    }
                } else {
                    console.log(`No data key in: ${JSON.stringify(jsonStringTopology)}. For Api Url: ${fullUrl}`);
                }
            } catch (error) {
                console.error(`Error fetching device links from URL: ${fullUrl} - ${error}`);
            }
        }
    }

    async devicesNodes(data) {
        for (const key of data.data) {
            if (key['system-ip']) {
                const upTime = key['uptime-date'];
                let timestamp = moment.unix(upTime / 1000).format(Constants.TOPOLOGY_TIME_FORMAT);

                const infoNodes = {};
                this.num += 1;

                infoNodes['id'] = this.num;
                infoNodes['name'] = key['host-name'];
                infoNodes['family'] = key['platformFamily'];
                infoNodes['ip'] = key['system-ip'];
                infoNodes['type'] = key['deviceType'];
                infoNodes['boarding time'] = timestamp;

                this.topologyDict.nodes.push(infoNodes);
            }
        }
    }

    async sdwanTopology(db,token,serverIp,sessionId) {
        try {
            const timestamp = helper.getTime();
            this.topologyDict.timestamp = timestamp;

            const headers = {
                'X-XSRF-TOKEN': token,
                'Cookie': `${sessionId}` 
            };
        
            // API URLs
            const deviceInventoryUrl = `https://${serverIp}${ApiUrls.DEVICE_INVENTORY_URL}`;
            const controllersUrl = `https://${serverIp}${ApiUrls.CONTROLLERS_URL}`;
            const vedgesUrl = `https://${serverIp}${ApiUrls.VEDGES_URL}`;
            const deviceControllersUrl = `https://${serverIp}${ApiUrls.DEVICE_CONNECTIONS_URL}`;
            const vedgeStatusUrl = `https://${serverIp}${ApiUrls.VEDGE_STATUS_URL}`;
            const bfdDeviceUrl = `https://${serverIp}${ApiUrls.BFD_DEVICE_URL}`;

            const deviceInventoryJson = await axios.get(deviceInventoryUrl, {headers: headers});
            const controllersJson = await axios.get(controllersUrl, {headers: headers});
            const vedgesJson = await axios.get(vedgesUrl, {headers: headers});
            const vedgesStatusJson = await axios.get(vedgeStatusUrl, {headers: headers});

            await this.devicesNodes(controllersJson.data);
            await this.devicesNodes(vedgesJson.data);

            await this.devicesLinks(deviceControllersUrl, deviceInventoryJson.data,headers);
            await this.devicesLinks(bfdDeviceUrl, vedgesStatusJson.data,headers);

            await insertSdwanSiteTopology(db, this.topologyDict);

            // this.topologyDict = { timestamp: '', nodes: [], links: [] };

        } catch (error) {
            console.error(`Exception in sdwanTopology : ${error}`);
        }
    }
}

module.exports = SDWANTopology;
