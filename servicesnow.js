const axios = require("axios");
const moment = require("moment");
const helpers = require("./Utilities/helper");

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};

// Extending the Date prototype to add an addMonths method
Date.prototype.addMonths = function(months) {
    var date = new Date(this.valueOf());
    date.setMonth(date.getMonth() + months);
    return date;
};

// Extending the Date prototype to add a getMonthAbbr method
Date.prototype.getMonthAbbr = function() {
    const monthAbbrs = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthAbbrs[this.getMonth()];
};

const InsertData = (json, CollectionName, db) => {
    return new Promise((resolve) => {
        db.collection(CollectionName).insertOne(json, function (error, result) {
            if (error) throw error;
            resolve(result);
        });
    });
};
const GetIncidentDetails = async function GetIncidentDetails(PackageData, db) {
    return new Promise((resolve) => {
        // console.log("PackageData",PackageData);
      axios.get(`${PackageData.ServiceNowAPI}`, {
        headers: {
          Authorization: "Basic " + Buffer.from(PackageData.ServiceNowUserName + ":" + PackageData.ServiceNowPassword).toString("base64"),
        },
      })
      .then(function (response) {
          resolve(response && response.data && response.data.result);
      })
      .catch(function (error) {
          console.error("ServiceNow Error : ", error.message);
          resolve([]);
      })
      .finally(function () {});
    });
};
const GetCRDetails = function GetCRDetails(PackageData) {
    return new Promise((resolve) => {
        axios
            .get(
                `${PackageData.ChangeRequestAPI}`,
                //"https://dev61175.service-now.com/api/now/v1/table/change_request",
                {
                    headers: {
                        Authorization: "Basic " + Buffer.from(PackageData.ServiceNowUserName + ":" + PackageData.ServiceNowPassword).toString("base64"),
                    },
                }
            )
            .then(function (response) {
                resolve(response.data.result);
            })
            .catch(function (error) {
                console.log("Error in GetCRDetails : ",error.message);
            })
            .finally(function () {});
    });
};
const GetTaskSLADetails = function GetTaskSLADetails(PackageData) {
    return new Promise((resolve) => {
        axios
            .get(
                `${PackageData.ServiceNowTaskSLAAPI}`,
                //"https://dev61175.service-now.com/api/now/table/task_sla",
                {
                    headers: {
                        Authorization: "Basic " + Buffer.from(PackageData.ServiceNowUserName + ":" + PackageData.ServiceNowPassword).toString("base64"),
                    },
                }
            )
            .then(function (response) {
                resolve(response.data.result);
            })
            .catch(function (error) {
                console.log("Error in GetTaskSLADetails : ",error.message);
            })
            .finally(function () {});
    });
};
// const GetCategorywiseTicketBreakUp=function GetCategorywiseTicketBreakUp(data)
// {
//     return new Promise(resolve => {
//         var groupedByCategory = Object.values(
//             data.reduce((grouping, item) => {
//               grouping[item.category] = [...(grouping[item.category] || []), item];
//               return grouping;
//             }, {})
//           );
//           groupedByCategory=groupedByCategory.map(function(item)
//           {
//             if(item[0].category!="" && item[0].category!=null && item[0].category!=null)
//             {
//                 let itemData={};
//                 itemData["Category"]=item[0].category;
//                 itemData["Count"]=item.length;
//                 return itemData;
//             }
//           })
//     resolve(groupedByCategory)
//     });
// }

const GetCategorywiseTicketBreakUp = function GetCategorywiseTicketBreakUp(data) {
    return new Promise((resolve) => {
        let arrDatewiseData = [];
        let NonClosedResolvedTicket = [...data];
        let groupedByMac = Object.values(
            NonClosedResolvedTicket.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );
        groupedByMac = groupedByMac.map(function (item) {
            let category_data = {};
            var subCat = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.subcategory] = [...(grouping[_item.subcategory] || []), _item];
                    return grouping;
                }, {})
            );
            subCat = subCat.map(function (item) {
                return { subcategory: item[0].subcategory, count: item.length };
            });

            category_data["Category"] = item[0].category;
            category_data["SubCategories"] = subCat;
            return category_data;
        });
        let objCatwiseData = {};
        //objCatwiseData["Data"]={"All":groupedByMac};
        arrDatewiseData.push({ All: groupedByMac });

        //For 90 day code start
        let NonClosedResolvedTicket90day = [...data].filter((a) => a.sys_created_on > new Date(Date.now()).addDays(-90));
        let groupedByMac90day = Object.values(
            NonClosedResolvedTicket90day.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );
        groupedByMac90day = groupedByMac90day.map(function (item) {
            let category_data = {};
            let subCat = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.subcategory] = [...(grouping[_item.subcategory] || []), _item];
                    return grouping;
                }, {})
            );
            subCat = subCat.map(function (item) {
                return { subcategory: item[0].subcategory, count: item.length };
            });

            category_data["Category"] = item[0].category;
            category_data["SubCategories"] = subCat;
            return category_data;
        });
        arrDatewiseData.push({ "90Day": groupedByMac90day });
        //For 90 day code ends

        //For 60 day code start
        let NonClosedResolvedTicket60day = [...data].filter((a) => a.sys_created_on > new Date(Date.now()).addDays(-60));
        let groupedByMac60day = Object.values(
            NonClosedResolvedTicket60day.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );
        groupedByMac60day = groupedByMac60day.map(function (item) {
            let category_data = {};
            let subCat = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.subcategory] = [...(grouping[_item.subcategory] || []), _item];
                    return grouping;
                }, {})
            );
            subCat = subCat.map(function (item) {
                return { subcategory: item[0].subcategory, count: item.length };
            });

            category_data["Category"] = item[0].category;
            category_data["SubCategories"] = subCat;
            return category_data;
        });
        arrDatewiseData.push({ "60Day": groupedByMac60day });
        //For 60 day code ends

        //For 30 day code start
        let NonClosedResolvedTicket30day = [...data].filter((a) => a.sys_created_on > new Date(Date.now()).addDays(-30));
        let groupedByMac30day = Object.values(
            NonClosedResolvedTicket30day.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );
        groupedByMac30day = groupedByMac30day.map(function (item) {
            let category_data = {};
            let subCat = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.subcategory] = [...(grouping[_item.subcategory] || []), _item];
                    return grouping;
                }, {})
            );
            subCat = subCat.map(function (item) {
                return { subcategory: item[0].subcategory, count: item.length };
            });

            category_data["Category"] = item[0].category;
            category_data["SubCategories"] = subCat;
            return category_data;
        });
        arrDatewiseData.push({ "30Day": groupedByMac30day });
        //For 30 day code ends

        //For 7 day code start
        let NonClosedResolvedTicket7day = [...data].filter((a) => a.sys_created_on > new Date(Date.now()).addDays(-7));
        let groupedByMac7day = Object.values(
            NonClosedResolvedTicket7day.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );
        groupedByMac7day = groupedByMac7day.map(function (item) {
            let category_data = {};
            let subCat = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.subcategory] = [...(grouping[_item.subcategory] || []), _item];
                    return grouping;
                }, {})
            );
            subCat = subCat.map(function (item) {
                return { subcategory: item[0].subcategory, count: item.length };
            });

            category_data["Category"] = item[0].category;
            category_data["SubCategories"] = subCat;
            return category_data;
        });
        arrDatewiseData.push({ "7Day": groupedByMac7day });
        //For 7 day code ends
        objCatwiseData["Data"] = arrDatewiseData;
        objCatwiseData["timestamp"] = new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
        resolve(objCatwiseData);
    });
};
const GetPrioritywiseTicketBreakUp = function GetPrioritywiseTicketBreakUp(data) {
    return new Promise((resolve) => {
        let NonClosedResolvedTicket = [...data];
        let arrDatewiseData = [];

        let groupedByCat = Object.values(
            NonClosedResolvedTicket.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );

        groupedByCat = groupedByCat.map(function (item) {
            // arrElement=arrElement.map(function(item)
            // {
            let category_data = {};
            let PriorityData = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.priority] = [...(grouping[_item.priority] || []), _item];
                    return grouping;
                }, {})
            );

            let PriorityDataNew = [...PriorityData];
            PriorityDataNew = PriorityDataNew.map(function (elem) {
                let data1 = {};
                let StateData = Object.values(
                    elem.reduce((grouping, _item) => {
                        grouping[_item.state] = [...(grouping[_item.state] || []), _item];
                        return grouping;
                    }, {})
                );
                StateData = StateData.map(function (stateItem) {
                    return { state: stateItem[0].state, count: stateItem.length };
                });
                if (StateData.find((o) => o.state === "New") == undefined) StateData.push({ state: "New", count: 0 });

                if (StateData.find((o) => o.state === "In Process") == undefined) StateData.push({ state: "In Process", count: 0 });

                if (StateData.find((o) => o.state === "On Hold") == undefined) StateData.push({ state: "On Hold", count: 0 });
                return { priority: elem[0].priority, state: StateData };
            });
            category_data["Category"] = item[0].category;
            category_data["Data"] = PriorityDataNew;
            return category_data;
            //  });
        });

        arrDatewiseData.push({ All: groupedByCat });

        //For 90 days start here
        let NonClosedResolvedTicket90day = [...data].filter((a) => a.sys_created_on > new Date(Date.now()).addDays(-90));
        let groupedByCat90day = Object.values(
            NonClosedResolvedTicket90day.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );

        groupedByCat90day = groupedByCat90day.map(function (item) {
            // arrElement=arrElement.map(function(item)
            // {
            let category_data = {};
            let PriorityData = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.priority] = [...(grouping[_item.priority] || []), _item];
                    return grouping;
                }, {})
            );

            let PriorityDataNew = [...PriorityData];
            PriorityDataNew = PriorityDataNew.map(function (elem) {
                let data1 = {};
                let StateData = Object.values(
                    elem.reduce((grouping, _item) => {
                        grouping[_item.state] = [...(grouping[_item.state] || []), _item];
                        return grouping;
                    }, {})
                );
                StateData = StateData.map(function (stateItem) {
                    return { state: stateItem[0].state, count: stateItem.length };
                });
                if (StateData.find((o) => o.state === "New") == undefined) StateData.push({ state: "New", count: 0 });

                if (StateData.find((o) => o.state === "In Process") == undefined) StateData.push({ state: "In Process", count: 0 });

                if (StateData.find((o) => o.state === "On Hold") == undefined) StateData.push({ state: "On Hold", count: 0 });
                return { priority: elem[0].priority, state: StateData };
            });
            category_data["Category"] = item[0].category;
            category_data["Data"] = PriorityDataNew;
            return category_data;
            //  });
        });
        arrDatewiseData.push({ "90Day": groupedByCat90day });
        //For 90 days ends here

        //For 60 days start here
        let NonClosedResolvedTicket60day = [...data].filter((a) => a.sys_created_on > new Date(Date.now()).addDays(-60));
        let groupedByCat60day = Object.values(
            NonClosedResolvedTicket60day.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );
        groupedByCat60day = groupedByCat60day.map(function (item) {
            // arrElement=arrElement.map(function(item)
            // {
            let category_data = {};
            let PriorityData = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.priority] = [...(grouping[_item.priority] || []), _item];
                    return grouping;
                }, {})
            );

            let PriorityDataNew = [...PriorityData];
            PriorityDataNew = PriorityDataNew.map(function (elem) {
                let data1 = {};
                let StateData = Object.values(
                    elem.reduce((grouping, _item) => {
                        grouping[_item.state] = [...(grouping[_item.state] || []), _item];
                        return grouping;
                    }, {})
                );
                StateData = StateData.map(function (stateItem) {
                    return { state: stateItem[0].state, count: stateItem.length };
                });
                if (StateData.find((o) => o.state === "New") == undefined) StateData.push({ state: "New", count: 0 });

                if (StateData.find((o) => o.state === "In Process") == undefined) StateData.push({ state: "In Process", count: 0 });

                if (StateData.find((o) => o.state === "On Hold") == undefined) StateData.push({ state: "On Hold", count: 0 });
                return { priority: elem[0].priority, state: StateData };
            });
            category_data["Category"] = item[0].category;
            category_data["Data"] = PriorityDataNew;
            return category_data;
            //  });
        });
        arrDatewiseData.push({ "60Day": groupedByCat60day });
        //For 60 days ends here

        //For 30 days start here
        let NonClosedResolvedTicket30day = [...data].filter((a) => a.sys_created_on > new Date(Date.now()).addDays(-30));
        let groupedByCat30day = Object.values(
            NonClosedResolvedTicket30day.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );
        groupedByCat30day = groupedByCat30day.map(function (item) {
            // arrElement=arrElement.map(function(item)
            // {
            let category_data = {};
            let PriorityData = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.priority] = [...(grouping[_item.priority] || []), _item];
                    return grouping;
                }, {})
            );

            let PriorityDataNew = [...PriorityData];
            PriorityDataNew = PriorityDataNew.map(function (elem) {
                let data1 = {};
                let StateData = Object.values(
                    elem.reduce((grouping, _item) => {
                        grouping[_item.state] = [...(grouping[_item.state] || []), _item];
                        return grouping;
                    }, {})
                );
                StateData = StateData.map(function (stateItem) {
                    return { state: stateItem[0].state, count: stateItem.length };
                });
                if (StateData.find((o) => o.state === "New") == undefined) StateData.push({ state: "New", count: 0 });

                if (StateData.find((o) => o.state === "In Process") == undefined) StateData.push({ state: "In Process", count: 0 });

                if (StateData.find((o) => o.state === "On Hold") == undefined) StateData.push({ state: "On Hold", count: 0 });
                return { priority: elem[0].priority, state: StateData };
            });
            category_data["Category"] = item[0].category;
            category_data["Data"] = PriorityDataNew;
            return category_data;
            //  });
        });
        arrDatewiseData.push({ "30Day": groupedByCat30day });
        //For 30 days ends here

        //For 7 days start here
        let NonClosedResolvedTicket7day = [...data].filter((a) => a.sys_created_on > new Date(Date.now()).addDays(-7));
        let groupedByCat7day = Object.values(
            NonClosedResolvedTicket7day.reduce((grouping, item) => {
                grouping[item.category] = [...(grouping[item.category] || []), item];
                return grouping;
            }, {})
        );
        groupedByCat7day = groupedByCat7day.map(function (item) {
            // arrElement=arrElement.map(function(item)
            // {
            let category_data = {};
            let PriorityData = Object.values(
                item.reduce((grouping, _item) => {
                    grouping[_item.priority] = [...(grouping[_item.priority] || []), _item];
                    return grouping;
                }, {})
            );

            let PriorityDataNew = [...PriorityData];
            PriorityDataNew = PriorityDataNew.map(function (elem) {
                let data1 = {};
                let StateData = Object.values(
                    elem.reduce((grouping, _item) => {
                        grouping[_item.state] = [...(grouping[_item.state] || []), _item];
                        return grouping;
                    }, {})
                );
                StateData = StateData.map(function (stateItem) {
                    return { state: stateItem[0].state, count: stateItem.length };
                });
                if (StateData.find((o) => o.state === "New") == undefined) StateData.push({ state: "New", count: 0 });

                if (StateData.find((o) => o.state === "In Process") == undefined) StateData.push({ state: "In Process", count: 0 });

                if (StateData.find((o) => o.state === "On Hold") == undefined) StateData.push({ state: "On Hold", count: 0 });
                return { priority: elem[0].priority, state: StateData };
            });
            category_data["Category"] = item[0].category;
            category_data["Data"] = PriorityDataNew;
            return category_data;
            //  });
        });
        arrDatewiseData.push({ "7Day": groupedByCat7day });
        //For 7 days ends here
        let objPriority = {};
        objPriority["timestamp"] = new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
        objPriority["Data"] = arrDatewiseData;
        resolve(objPriority);
    });
};
const GetQuarterlySLA = function GetQuarterlySLA(data) {
    return new Promise((resolve) => {
        let AllSLAs = [...data];
        AllSLAs = AllSLAs.map(function (item) {
            item.sys_created_on = new Date(item.sys_created_on);
            return item;
        });
        let TotalTickets = AllSLAs.filter((a) => a.sys_created_on > new Date(new Date(new Date(Date.now()).addDays(-90).setHours(0)).setMinutes(0)));
        let SLAAchieved = TotalTickets.filter((a) => a.has_breached === "false");
        let objQuarterlyData = {};
        objQuarterlyData["Total"] = TotalTickets.length;
        objQuarterlyData["Achieved"] = SLAAchieved.length;
        objQuarterlyData["timestamp"] = new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
        resolve(objQuarterlyData);
    });
};

const GetDailySLA = function GetDailySLA(data) {
    return new Promise((resolve) => {
        let AllSLAs = [...data];
        AllSLAs = AllSLAs.map(function (item) {
            item.sys_created_on = new Date(item.sys_created_on);
            return item;
        });
        let TotalTickets = AllSLAs.filter((a) => a.sys_created_on > new Date(new Date(new Date(Date.now()).addDays(-1).setHours(0)).setMinutes(0)));
        let SLAAchieved = TotalTickets.filter((a) => a.has_breached === "false");
        let objQuarterlyData = {};
        objQuarterlyData["Total"] = TotalTickets.length;
        objQuarterlyData["Achieved"] = SLAAchieved.length;
        objQuarterlyData["timestamp"] = new Date(new Date(new Date(new Date(Date.now()).setMinutes(parseInt(new Date(Date.now()).getMinutes() / 5) * 5)).setSeconds(0)).setMilliseconds(0));
        resolve(objQuarterlyData);
    });
};

const CalculateAndInsertMonthlySLA = function CalculateAndInsertMonthlySLA(db, data) {
    return new Promise(async(resolve) => {
        let AllSLAs = [...data];
        AllSLAs = AllSLAs.map(function (item) {
            item.sys_created_on = new Date(item.sys_created_on);
            return item;
        });

        let MonthToBeDeleted = new Date(Date.now()).addMonths(-3).getMonthAbbr();
        let CurrentMonth = new Date(Date.now()).getMonthAbbr();
        let CurrentMonthYear = new Date(Date.now()).getFullYear();

        let LastMonth = new Date(Date.now()).addMonths(-1).getMonthAbbr();
        let LastMonthYear = new Date(Date.now()).addMonths(-1).getFullYear();

        let SecondLastMonth = new Date(Date.now()).addMonths(-2).getMonthAbbr();
        let SecondLastMonthYear = new Date(Date.now()).addMonths(-2).getFullYear();
        let SecondLastMonthStartTime = new Date(new Date(new Date(new Date(new Date(new Date(Date.now()).addMonths(-2)).setDate(1)).setHours(0)).setMinutes(0)).setSeconds(0));

        let LastMonthStartTime = new Date(new Date(new Date(new Date(new Date(new Date(Date.now()).addMonths(-1)).setDate(1)).setHours(0)).setMinutes(0)).setSeconds(0));
        let ThisMonthStartTime = new Date(new Date(new Date(new Date(new Date(new Date(Date.now())).setDate(1)).setHours(0)).setMinutes(0)).setSeconds(0));

        const acknowledge =  await db.collection("MonthlySLA").deleteMany({ Month: MonthToBeDeleted });

        let SecondLastMonthTotalSLA = AllSLAs.filter((a) => a.sys_created_on >= SecondLastMonthStartTime && a.sys_created_on < LastMonthStartTime);
        let SecondLastMonthAchievedSLA = SecondLastMonthTotalSLA.filter((a) => a.has_breached === "false");
        let SecondLastMonthPercentage = 0;
        if(SecondLastMonthAchievedSLA.length > 0 && SecondLastMonthTotalSLA.length > 0) {
            SecondLastMonthPercentage = (SecondLastMonthAchievedSLA.length / SecondLastMonthTotalSLA.length) * 100;
        }

        await db.collection("MonthlySLA").deleteMany({ Month: SecondLastMonth });
        await db.collection("MonthlySLA").insertOne(
            {
                Month: SecondLastMonth,
                Percentage: Math.floor(SecondLastMonthPercentage),
                Year: SecondLastMonthYear,
            }
        );
        
        let LastMonthTotalSLA = AllSLAs.filter((a) => a.sys_created_on >= LastMonthStartTime && a.sys_created_on < ThisMonthStartTime);
        let LastMonthAchievedSLA = LastMonthTotalSLA.filter((a) => a.has_breached === "false");
        let LastMonthPercentage = 0;
        if(LastMonthAchievedSLA.length > 0 && LastMonthTotalSLA.length > 0){
            LastMonthPercentage = (LastMonthAchievedSLA.length / LastMonthTotalSLA.length) * 100;
        }

        await db.collection("MonthlySLA").deleteMany({ Month: LastMonth });
        await db.collection("MonthlySLA").insertOne(
            {
                Month: LastMonth,
                Percentage: Math.floor(LastMonthPercentage),
                Year: LastMonthYear,
            }
        );
        
        let ThisMonthTotalSLA = AllSLAs.filter((a) => a.sys_created_on >= ThisMonthStartTime);
        let ThisMonthAchievedSLA = ThisMonthTotalSLA.filter((a) => a.has_breached === "false");
        let ThisMonthPercentage = 0; 
        if(ThisMonthAchievedSLA.length > 0 && LastMonthTotalSLA.length > 0){
            ThisMonthPercentage = (ThisMonthAchievedSLA.length / ThisMonthTotalSLA.length) * 100;
        }

        await db.collection("MonthlySLA").deleteMany({ Month: CurrentMonth });
        await db.collection("MonthlySLA").insertOne(
            {
                Month: CurrentMonth,
                Percentage: Math.floor(ThisMonthPercentage),
                Year: CurrentMonthYear,
            }
        );
    });
};

const ArchieveServiceNow = function ArchieveServiceNow(db, data) {
    return new Promise((resolve) => {
        let myquery = {
            timestamp: {
                $lte: new Date(new Date(new Date(Date.now()).addDays(-90).setHours(0)).setMinutes(0)),
            },
        };
        db.collection("AllNonClosedResolvedTickets")
            .find(myquery)
            .toArray(function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    db.collection("ArchievedDataServiceNow").insertMany(result, function (err, res) {
                        if (err) throw err;
                        if (Object.keys(res.insertedIds).length > 0) {
                            //code to delete from main collection
                            db.collection("AllNonClosedResolvedTickets").deleteMany(myquery, function (err, res) {
                                if (err) throw err;
                                resolve("");
                            });
                        }
                    });
                }
            });
        // resolve(objQuarterlyData);
    });
};
exports.GetIncidentDetails = GetIncidentDetails;
exports.GetCRDetails = GetCRDetails;
exports.GetTaskSLADetails = GetTaskSLADetails;
exports.GetCategorywiseTicketBreakUp = GetCategorywiseTicketBreakUp;
exports.GetPrioritywiseTicketBreakUp = GetPrioritywiseTicketBreakUp;
exports.GetQuarterlySLA = GetQuarterlySLA;
exports.CalculateAndInsertMonthlySLA = CalculateAndInsertMonthlySLA;
exports.ArchieveServiceNow = ArchieveServiceNow;
exports.GetDailySLA = GetDailySLA;
