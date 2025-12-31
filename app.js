var cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');

// var StartTime=new Date("2019-11-27T11:37:00");

// mongoose.connect('mongodb://127.0.0.1:27017/TestMongoose');
// // mongoose.connection.on('connected', () => console.log('Connected'));
// // mongoose.connection.on('error', () => console.log('Connection failed with - ',err));

// const slaSchema = new mongoose.Schema({
//     description: String,
//     sys_updated_by: String,   
//     number: String,
//     subcategory: String,
//     timestamp:Date
// });

// const Sla = mongoose.model('Test', slaSchema);


// async function saveSla() 
// {
//     const sla = new Sla({
//         description: "This network device VSPL_Demo_Access_SW1.vspllab.in is unreachable from controller. The device role is ACCESS.",
//         sys_updated_by:"admin",
//         number: "INC0010869",
//         subcategory: "dns"
//     });
//     const result = await sla.save();
// }

// //saveSla();

// const data = [
//   {
//     description: "Desc1.",
//     sys_updated_by:"admin1",
//     number: "INC0010869_1",
//     subcategory: "dns1"
// },
// {
//   description: "Desc2.",
//   sys_updated_by:"admin2",
//   number: "INC0010869_2",
//   subcategory: "dns2"
// }
// ];

// // Sla.insertMany(data).then((docs)=>{
// // });

// function createListOfModels(item) {
//   var element = {
//     description: item.description,
//     sys_updated_by:item.sys_updated_by,
//     number: item.number,
//     subcategory: item.subcategory,
//     timestamp:new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes()/5)*5)).setSeconds(0)).setMilliseconds(0))
//   }
//   return element;
// }

// function getListOfModels() 
// {
  
//   axios.get('https://api.meraki.com/api/v0/organizations/775051/networks',{ headers: {'X-Cisco-Meraki-API-Key':'8f061340df0684d187f55c1b9e77efdd1445e7c0'}})
//   .then(function (response) {
//     // handle success
//     const Data=response.data.result.map(createListOfModels);
//     Sla.insertMany(Data).then((docs)=>
//     {
//        });
//   })
//   .catch(function (error) {
//     // handle error
//   })
//   .finally(function () {
//     // always executed
//   });
//  }
  
//   //document.getElementById("demo").innerHTML = persons.map(getFullName);

//  /* axios.get('https://dev61175.service-now.com/api/now/v1/table/incident',{ headers: {'Authorization':'Basic YWRtaW46V2VsY29tZUAx'}})
//   .then(function (response) {
//     // handle success
//     const Data=response.data.result.map(createListOfModels);
//     Sla.insertMany(Data).then((docs)=>
//     {
//        });
//   })
//   .catch(function (error) {
//     // handle error
//   })
//   .finally(function () {
//     // always executed
//   });
//  }

// */
//  var MainTask=cron.schedule('*/5 * * * *', () => 
// {
//     getListOfModels();
//   //   axios.get('https://dev61175.service-now.com/api/now/v1/table/incident',{ headers: {'Authorization':'Basic YWRtaW46V2VsY29tZUAx'}})
//   // .then(function (response) {
//   //   // handle success
//   // })
//   // .catch(function (error) {
//   //   // handle error
//   // })
//   // .finally(function () {
//   //   // always executed
//   // });
//   });


//   var SupportingTask=cron.schedule('1 * * * * *', () => 
// {

//   if(StartTime<new Date(Date.now()))
//   {  
//     MainTask.start();
//     SupportingTask.stop();
//   }
//   /*
//     axios.get('https://dev61175.service-now.com/api/now/v1/table/incident',{ headers: {'Authorization':'Basic YWRtaW46V2VsY29tZUAx'}})
//   .then(function (response) {
//     // handle success
//   })
//   .catch(function (error) {
//     // handle error
//   })
//   .finally(function () {
//     // always executed
//   });
// */
//   });
//   SupportingTask.start();

function writeJsonToFile(data, filename) {
  // Convert the data to a JSON string
  const jsonString = JSON.stringify(data, null, 2); // The `null, 2` part formats the output for readability

  // Append the JSON string to the file
  fs.appendFile(filename, jsonString + '\n\n\n\n', 'utf8', (err) => {  // Add a newline after each JSON object for readability
    if (err) {
      console.error('Error appending file:', err);
    } else {
      console.log('Data successfully appended');
    }
  });
}
  module.exports = writeJsonToFile;
  // Example usage
  
  