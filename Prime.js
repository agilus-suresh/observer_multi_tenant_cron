var FTPS = require('ftps');
const helpers = require('./Utilities/helper')
//var Node_FTP = require('node-ftp');
// // var childProcess = require('child_process');
// // var oldSpawn = childProcess.spawn;
// // var ftps = new lftp(config)
// // var stream = ftps.raw('find').execAsStream()
// // stream.pipe(process.stdout)


// var ftps = new Node_FTP({
//     // ftp://10.6.1.14:21/reports/CompositeReport/
//   host: 'ftp://10.6.1.14:21/reports/CompositeReport/',
//   username: 'ftp-user',
//   password: 'Pass2006',
//   protocol: 'ftp'
// });

// // (function(){
// //     var childProcess = require("child_process");
// //     var oldSpawn = childProcess.spawn;
// //     function mySpawn(){
// //     var result = oldSpawn.apply(this, arguments);
// //     return result;
// //     }
// //         childProcess.spawn = mySpawn;
// //     })(); 
// // function mySpawn() {
// //     var result = oldSpawn.apply(this, arguments);
// //     return result;
// // }

// // const { spawn } = require('child_process');
// // const ls = spawn('ls', ['-lh', '/usr']);

// // ls.stdout.on('data', (data) => {
// // });

// // ls.stderr.on('data', (data) => {
// //   console.error(`stderr: ${data}`);
// // });

// // ls.on('close', (code) => {
// // });



// var c = new Client();
// c.on('ready', function () {
//   c.get('/reports/CompositeReport/Observer-RogueAPEvents_20191217_093000_622.csv', function (err, list) {
//     if (err) throw err;
//     list.once('close', function () { c.end(); });
//     list.pipe(fs.createWriteStream('foo.local-copy.csv'));
//     c.end();
//   });
// });
// // connect to localhost:21 as anonymousss
// //c.connect();
// c.connect(connectionProperties);

// ftps.exec(function (err, res) {
//   // childProcess.spawn = mySpawn;
//   if (err) {
//   }
//   else {
//   }
// });
var Client = require('ftp');
var fs = require('fs');
var path = require('path');
const csv = require('csvtojson');
var primeReadFile = false;

var filePath = path.join(__dirname, 'manish.csv');
// var connectionProperties =
// {
//   host: '10.6.1.14',
//   user: 'ftp-user',
//   password: 'Pass2006',
//   port: 21
// };

var downloadList = [];

var c = new Client();
c.on('ready', function () {

  c.list('reports/CompositeReport/', function (err, list) {

    if (err) throw err;
    list.map(function (entry) {
      // if ( entry.name.match(/tar\.gz$/) && entry.name.match(/^filename/) ){
      downloadList.push(entry.name);
      // }
    });
    // Download remote files and save it to the local file system:
    c.get('reports/CompositeReport/' + downloadList[downloadList.length - 1], function (err, stream) {

      if (err) throw err;
      stream.once('close', function () { c.end(); });
      stream.pipe(fs.createWriteStream(downloadList[downloadList.length - 1]));

    });
    c.end();

  });

});
//c.connect(connectionProperties);

function readFileForRough(db) {
  let formatedDate = 'Rouge_AP_' + formatedFileName();
  return new Promise(resolve => {
    var filePath = path.join(__dirname, 'Rouge_AP_20191010_1800.csv');
    var ReadData = fs.readFile(filePath, { encoding: 'utf-8' }, async function (err, data) {
      if (primeReadFile) {
        helpers.buildStatusForTools(200, "Prime", db);
      } else {
        helpers.buildStatusForTools(500, "Prime", db)
      }
      primeReadFile = false;
      const jsonArray = await csv().fromFile(filePath);
      resolve(jsonArray);
    })
  });
}

function readFile() {
  let formatedDate = 'AP_Throughput_' + formatedFileName();
  return new Promise(resolve => {
    var filePath = path.join(__dirname, 'AP_Throughput_20191010_1800.csv');
    var ReadData = fs.readFile(filePath, { encoding: 'utf-8' }, async function (err, data) {
      if (!err) {
        primeReadFile = true;
        let fileData = data.slice(190);
        let jsonArray = await csv().fromString(fileData);
        //jsonArray1 = jsonArray1.splice(6);
        resolve(jsonArray);
      } else {
      }

    })
  });
}
// Async / await usage
function formatedFileName() {
  var d = new Date();
  var datestring = 'Rouge_AP_' + d.getFullYear() + "" + (d.getMonth() + 1) + "" + d.getDate() + "_" +
    d.getHours() + "" + '00';
  return datestring;

}

async function GetAPwiseAvgPeakThroughput(packageData) {
  let fileRead = await readFile();
  return new Promise(resolve => {
    resolve(fileRead);
  })
}
async function RoguedAPInterferenceReport(packageData, db) {
  let fileRead = await readFileForRough(db);
  return new Promise(resolve => {
    fileRead.map(item => {
      Detecting_AP_Name = item['Detecting AP Name'],
        SSID = item['SSID'],
        Rogue_Ap_Channel_Number = ['Rogue_Ap_Channel_Number'],
        RSSI = ['RSSI (dBm)']
    })

    //variable name will be change according to file
    resolve(fileRead);
  })
}
exports.RoguedAPInterferenceReport = RoguedAPInterferenceReport
exports.GetAPwiseAvgPeakThroughput = GetAPwiseAvgPeakThroughput