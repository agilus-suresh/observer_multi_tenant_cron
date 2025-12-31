// import { MongoClient, ObjectId } from "mongodb";

// /* ================= CONFIG ================= */

// const PARENT_URI = "mongodb://localhost:27017";
// const PARENT_DB = "observer_master";

// const CLIENTS = [
//   {
//     clientId: "clientA",
//     uri: "mongodb://localhost:27017/multiTenantTest",
//     dbName: "clientA_db"
//   },
//   {
//     clientId: "clientB",
//     uri: "mongodb://localhost:27017/multiTenantTest2",
//     dbName: "clientB_db"
//   }
// ];

// // ONLY collections you really need
// const WATCH_COLLECTIONS = [
//   "tbl_Package",
//   "TblServiceList",
//   "dnac_data"
// ];

// /* ================= HELPERS ================= */

// function mapId(clientId, originalId) {
//   return new ObjectId(
//     Buffer.from(`${clientId}_${originalId}`).slice(0, 12)
//   );
// }

// /* ================= MAIN ================= */

// (async () => {
//   console.log("🚀 Starting Merge Watcher");

//   const parentClient = new MongoClient(PARENT_URI);
//   await parentClient.connect();
//   const parentDb = parentClient.db(PARENT_DB);

//   console.log("✅ Connected to parent DB");

//   for (const client of CLIENTS) {
//     startWatcher(client, parentDb);
//   }
// })();

// /* ================= WATCHER ================= */

// async function startWatcher(clientConfig, parentDb) {
//   const client = new MongoClient(clientConfig.uri);
//   await client.connect();

//   const db = client.db(clientConfig.dbName);
//   console.log(`👀 Watching client: ${clientConfig.clientId}`);

//   for (const col of WATCH_COLLECTIONS) {
//     const stream = db.collection(col).watch([], {
//       fullDocument: "updateLookup"
//     });

//     (async () => {
//       for await (const change of stream) {
//         try {
//           const collection = parentDb.collection(col);
//           const mappedId = mapId(clientConfig.clientId, change.documentKey._id);

//           switch (change.operationType) {
//             case "insert":
//             case "replace":
//               await collection.replaceOne(
//                 { _id: mappedId },
//                 {
//                   ...change.fullDocument,
//                   _id: mappedId,
//                   clientId: clientConfig.clientId,
//                   sourceDb: clientConfig.dbName,
//                   syncedAt: new Date()
//                 },
//                 { upsert: true }
//               );
//               console.log(`✅ ${clientConfig.clientId} → insert ${col}`);
//               break;

//             case "update":
//               await collection.updateOne(
//                 { _id: mappedId },
//                 { $set: change.updateDescription.updatedFields }
//               );
//               console.log(`✏️ ${clientConfig.clientId} → update ${col}`);
//               break;

//             case "delete":
//               await collection.updateOne(
//                 { _id: mappedId },
//                 { $set: { deleted: true, deletedAt: new Date() } }
//               );
//               console.log(`🗑 ${clientConfig.clientId} → delete ${col}`);
//               break;
//           }
//         } catch (err) {
//           console.error(`❌ Error (${clientConfig.clientId})`, err);
//         }
//       }
//     })();
//   }
// }




import { MongoClient, ObjectId } from "mongodb";

// ------------------ CONFIG ------------------ //
const MONGO_URI = "mongodb://127.0.0.1:27017";
const PARENT_DB_NAME = "observer_master";
const SYNC_INTERVAL_MS = 60 * 1000; // 1 min

const CLIENTS = [
  { name: "clientA", dbName: "kotak_db" },
  { name: "clientB", dbName: "jk_db" }
];

// ------------------ HELPERS ------------------ //
function mapId(clientId, originalId) {
  return new ObjectId(
    Buffer.from(`${clientId}_${originalId}`).slice(0, 12)
  );
}

async function mergeCollection(clientDB, parentDB, clientName, collName) {
  // Get last merged timestamp for this collection
  const cronStatus = await parentDB.collection("cron_status").findOne({
    clientId: clientName,
    collection: collName
  });
  const lastMergedAt = cronStatus?.lastMergedAt || new Date(0);

  // Check if collection exists
  const collections = await clientDB.listCollections({ name: collName }).toArray();
  if (!collections.length) return;

  // Fetch new/updated documents
  const docs = await clientDB.collection(collName)
    .find({ modifiedAt: { $gt: lastMergedAt } })
    .toArray();

  if (!docs.length) return;

  const bulkOps = docs.map(doc => ({
    updateOne: {
      filter: { _id: mapId(clientName, doc._id) },
      update: { $set: { ...doc, clientId: clientName } },
      upsert: true
    }
  }));

  await parentDB.collection(collName).bulkWrite(bulkOps);
  console.log(`Merged ${docs.length} docs from ${clientName}.${collName}`);

  // Update cron status
  await parentDB.collection("cron_status").updateOne(
    { clientId: clientName, collection: collName },
    { $set: { lastMergedAt: new Date() } },
    { upsert: true }
  );
}

// ------------------ MAIN MERGE ------------------ //
async function mergeClient(client, parentDB) {
  const clientConn = new MongoClient(MONGO_URI);
  try {
    await clientConn.connect();
    const clientDB = clientConn.db(client.dbName);

    // List all collections dynamically
    const collections = await clientDB.listCollections().toArray();
    for (const coll of collections) {
      const collName = coll.name;
      await mergeCollection(clientDB, parentDB, client.name, collName);
    }
  } catch (err) {
    console.error(`❌ Error merging client ${client.name}:`, err);
  } finally {
    await clientConn.close();
  }
}

async function main() {
  const parentClient = new MongoClient(MONGO_URI);
  await parentClient.connect();
  const parentDB = parentClient.db(PARENT_DB_NAME);
  console.log("✅ Connected to parent DB");

  while (true) {
    for (const client of CLIENTS) {
      await mergeClient(client, parentDB);
    }

    // Wait before next cycle
    await new Promise(r => setTimeout(r, SYNC_INTERVAL_MS));
  }
}

main().catch(err => {
  console.error("Fatal error in db-merge:", err);
  process.exit(1);
});

