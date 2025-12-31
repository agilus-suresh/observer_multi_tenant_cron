process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
var cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
var https = require('https');
var iconv = require('iconv-lite');
//var StartTime=new Date("2019-11-27T11:37:00");

mongoose.connect('mongodb://127.0.0.1:27017/TestMongoose');
// mongoose.connection.on('connected', () => console.log('Connected'));
// mongoose.connection.on('error', () => console.log('Connection failed with - ',err));

var options = {
  hostname: '10.122.1.25',
  path: '/dna/system/api/v1/auth/token',
  method: 'POST',
  headers: {'Authorization':'Basic YWRtaW46UGFzczIwMTg='}
};
var a=10;
var b=20;
var addStr=`Hi This is addiiton of ${a} and ${b}`;

// const boo = (async () => {
//   let x=(() =>
//   { 
//     return new Promise(resolve => 
//       {           
//         for(d=0;d<100000;d++)         
//       });
//   })();   
// })();

/*
const Main=(async () => {
try 
{      
  var APIToken=await GetToken();
} catch (err) 
{
}
})();*/

function GetToken(request)
{
    return new Promise(resolve => 
        {
            var req = https.request(options, function(res) {     
            var data = [];
              res.on('data', function(chunk) {
                data.push(chunk);
            }).on('end', function() {
                //at this point data is an array of Buffers
                //so Buffer.concat() can make us a new Buffer
                //of all of them together
                var buffer = Buffer.concat(data);
                var str = iconv.decode(buffer, 'windows-1252');
                resolve(str);
            });
            });
            req.end();
            req.on('error', function(e) {
              console.error(e);
            });
        });
}

//
/*
axios.post('https://10.122.1.25/dna/system/api/v1/auth/token',{ headers: {'Authorization':'Basic YWRtaW46UGFzczIwMTg='}})
.then(function (response) {
})
.catch(function (error) {
  // handle error
})
.finally(function () {
  // always executed
});
*/
// function getNetworkList()
// {
//     axios.get('https://api.meraki.com/api/v0/organizations/775051/networks',{ headers: {'X-Cisco-Meraki-API-Key':'8f061340df0684d187f55c1b9e77efdd1445e7c0'}})
//       .then(function (response) {
//         // handle success
//         const Data=response.data.map(createListOfModels);
//         const FinalData="";
//         //const FinalData=Promise.all(Data.map(createFinalData));
//         Promise.all(Data.map(createFinalData)).then(
//         // Sla.insertMany(Data).then((docs)=>
//         // {
//         //    });
//       })
//       .catch(function (error) {
//         // handle error
//       })
//       .finally(function () {
//         // always executed
//       });
// }

//getNetworkList();

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

//saveSla();

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

// Sla.insertMany(data).then((docs)=>{
// });

function createListOfModels(item) 
{
  var element = 
  {
    NetworkId: item.id,
    NetworkName:item.name
  }
  return element;
}

async function createFinalData(item) 
{

  var url='https://api.meraki.com/api/v0/networks/'+item.NetworkId+'/l7FirewallRules/applicationCategories';

  axios.get(url,{data: {
    Test_ID: 12345
  },headers: {'X-Cisco-Meraki-API-Key':'8f061340df0684d187f55c1b9e77efdd1445e7c0'}})
      .then(function (response) 
      {
        // handle success
        // const Data=response.data.map(createListOfModels);
        // const FinalData=Data.map(createFinalData);
           
           //resolve();
        // Sla.insertMany(Data).then((docs)=>
        // {
        //    });
      })
      .catch(function (error) {
        // handle error
      })
      .finally(function () {
        // always executed
      });


      
  // var element = 
  // {
  //   NetworkId: item.id,
  //   NetworkName:item.name
  // }
  // return element;
}

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

//  var MainTask=cron.schedule('*/1 * * * *', () => 
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
