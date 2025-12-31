// const axios = require('axios');
// const nodemailer = require('nodemailer');
// const { Constants, ApiUrls, Osm, DbCommon, CommonUtils } = require('./someUtility'); // Assuming these are defined elsewhere

// class GetUpdatedTopology {
//   constructor() {
//     this.topology_data = {
//       vmanage_server: [],
//       host_name: [],
//       ip: [],
//       boarding_time: []
//     };
//   }

//   async sendingEmail(server_ip, db_name, diffs) {
//     winston.info('Inside sendingEmail function.');
//     try {
//       const subject = `SDWAN vManage Device Update Notification: ${server_ip}`;
//       const body = `Following device added: ${JSON.stringify(diffs)}`;
//       const toEmails = 'akash.singh@velocis.co.in';
//       const files = [];

//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: 'your-email@gmail.com',
//           pass: 'your-email-password'
//         }
//       });

//       const mailOptions = {
//         from: 'your-email@gmail.com',
//         to: toEmails,
//         subject: subject,
//         text: body,
//         attachments: files
//       };

//       const emailSendStatus = await transporter.sendMail(mailOptions);

//       if (!emailSendStatus) {
//         return null;
//       }

//       winston.info('--------------- Removing inventory update. ---------------');
//       const removeInventoryResult = await Osm.removeInventoryUpdate(server_ip, db_name);
//       if (!removeInventoryResult) {
//         winston.error('Exception occurred while removing inventory data from scheduler model: backup: (remove_inventory_update).');
//       }

//       winston.info('--------------- Copy scheduled table to backup inventory update. ---------------');
//       const copyInventoryResult = await Osm.copyScheduledTableToBackup(server_ip, db_name);
//       if (!copyInventoryResult) {
//         winston.error('Exception occurred while copying inventory data from scheduler model: backup: (copy_scheduled_table_to_backup).');
//       }

//       winston.info('Exiting sendingEmail function.');
//     } catch (ex) {
//       winston.error(`Exception occurred while sending emails: ${ex}`);
//       winston.error(`Exception traceback is: ${ex.stack}`);
//     }
//   }

//   async getUpdatedTopology(db,token,serverIp,sessionId) {

//     try {
//       this.topology_data = {
//         vmanage_server: [],
//         host_name: [],
//         ip: [],
//         boarding_time: []
//       };

//       const headers = {
//         'X-XSRF-TOKEN': token,
//         'Cookie': `${sessionId}` 
//       };

//       const customer = await DbCommon.getVManageDetail(client);

//       const truncateDbResult = await Osm.truncateInventoryUpdate(client);
//       if (typeof truncateDbResult !== 'boolean') {
//         winston.error('Exception occurred while truncating data in db (truncateInventoryUpdate).');
//         return null;
//       }

//       const deviceInventoryUrl = `https://${serverIp}${ApiUrls.DEVICE_INVENTORY_URL}`;

//       const deviceInventoryResponse = await axios.get(deviceInventoryUrl,{headers: headers});

//       const deviceInventoryJson = deviceInventoryResponse.data;
//       this.topology_data.vmanage_server.push(serverIp);

//       for (const item of deviceInventoryJson.data) {
//         const updateTime = new Date(parseFloat(item["uptime-date"]) / 1000).toISOString();
//         this.topology_data.host_name.push(item["host-name"]);
//         this.topology_data.ip.push(item["system-ip"]);
//         this.topology_data.boarding_time.push(updateTime);
//       }

//       const inventoryData = {
//         vmanage_ip: serverIp,
//         scheduled_device_json: this.topology_data
//       };

//       const getUpdatedTopoData = [inventoryData];

//       const updateInventoryDb = await Osm.insertDataIntoInventoryUpdate(client, getUpdatedTopoData);
//       if (typeof updateInventoryDb !== 'boolean') {
//         winston.error('Exception occurred while saving data in db (insertDataSdwanAlarmTableRealTime).');
//         return null;
//       }

//       const inventoryDbData = await Osm.fetchDataFromInventory(serverIp, client, Constants.COLLECTION_SCHEDULED_INVENTORY_TABLE);
//       winston.info(`Fetched inventory db data is: ${JSON.stringify(inventoryDbData)}`);

//       if (!inventoryDbData) {
//         winston.error('Exception occurred while fetching data from scheduler model: original (fetchDataFromInventory).');
//         return null;
//       }

//       const inventoryBackupDbData = await Osm.fetchDataFromInventory(serverIp, client, Constants.COLLECTION_INVENTORY_TABLE);
//       winston.info(`Fetched backup inventory db data is: ${JSON.stringify(inventoryBackupDbData)}`);

//       if (!inventoryBackupDbData) {
//         winston.error('Exception occurred while fetching data from scheduler model: backup (fetchDataFromInventory).');
//         return null;
//       }

//       const orgInventoryHostName = inventoryDbData[0].scheduled_device_json.host_name;
//       const backupInventoryHostName = inventoryBackupDbData[0].scheduled_device_json.host_name;

//       winston.info('Started process for sending emails.');
//       const joinedInventoryHostName = [...orgInventoryHostName, ...backupInventoryHostName];
//       if (orgInventoryHostName.length < backupInventoryHostName.length) {
//         winston.info('Original host name is less (<) than backup host name.');
//         const addDif = joinedInventoryHostName.filter(i => !orgInventoryHostName.includes(i) || !backupInventoryHostName.includes(i));
//         winston.info(`Add diff is: ${JSON.stringify(addDif)}`);
//         await this.sendingEmail(serverIp, client, addDif);
//       }

//       if (orgInventoryHostName.length > backupInventoryHostName.length) {
//         winston.info('Original host name is greater (>) than backup host name.');
//         const deleteDif = joinedInventoryHostName.filter(i => !orgInventoryHostName.includes(i) || !backupInventoryHostName.includes(i));
//         winston.info(`Delete diff is: ${JSON.stringify(deleteDif)}`);
//       }

//       if (orgInventoryHostName.length === backupInventoryHostName.length) {
//         winston.info('Original host name is equal to (==) backup host name.');
//         const equalDif = orgInventoryHostName.concat(backupInventoryHostName).filter(i => !orgInventoryHostName.includes(i) || !backupInventoryHostName.includes(i));
//         winston.info(`Equal diff is: ${JSON.stringify(equalDif)}`);
//       }

//     } catch (error) {
//       console.error(`Exception traceback is: ${ex.stack}`);
//     }
//   }
// }

// module.exports = GetUpdatedTopology;
