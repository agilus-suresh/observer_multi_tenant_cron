const axios = require('axios');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/TestMongoose');
// mongoose.connection.on('connected', () => console.log('Connected'));
// mongoose.connection.on('error', () => console.log('Connection failed with - ',err));

const slaSchema = new mongoose.Schema({
    description: String,
    sys_updated_by: String,   
    number: String,
    subcategory: String,
    timestamp:Date
});

const Sla = mongoose.model('Test', slaSchema);

function resolveAfter2Seconds() 
{
    return new Promise(resolve => 
        {
            axios.get('https://dev61175.service-now.com/api/now/v1/table/incident',{ headers: {'Authorization':'Basic YWRtaW46V2VsY29tZUAx'}})
            .then(function (response) {
              // handle success
              const Data=response.data.result.map(createListOfModels);
              Sla.insertMany(Data).then(async (docs)=>{
                   //resolve();
                   var result = await function2();
                  // var result3 = await function3();
                   
                 });
            })
            .catch(function (error) {
              // handle error
            })
            .finally(function () {
              // always executed
            });
    //   setTimeout(() => {
    //     resolve('resolved');
    //   }, 20000);
    });
  }
  
  function function2()
  {
    return new Promise(resolve => 
        {
            for(var i=0;i<=100000;i++)
            {                 
            }
            // var test=function()
            // {
            //     for(var i=0;i<=100000;i++)              
            // }  
            // test();
            resolve();                                                       
        });
  }

  function asyncCall() 
  {
      var i=0;
      while(i<=100000)
      {
        i++;
      }
    // for(var i=0;i<=100000;i++)
    // {                
    // }

       var result = await resolveAfter2Seconds();
    // expected output: 'resolved'
  }
  
  function createListOfModels(item) {
    var element = {
      description: item.description,
      sys_updated_by:item.sys_updated_by,
      number: item.number,
      subcategory: item.subcategory,
      timestamp:new Date(Date.now())
    }
    return element;
  }

 asyncCall();