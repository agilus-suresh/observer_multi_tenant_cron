const axios = require("axios");
const EVEREST_USERNAME = "sudhanshu.kumar@agilustech.in";
const EVEREST_PASSWORD = "Velocis@4321";
const EVEREST_API_URL = "http://10.11.12.84:9090";
const EVEREST_INCIDENT_COLLECTION = "everestIncidents";

async function getAuthToken() {
  try {
    const response = await axios.post(
      `${EVEREST_API_URL}/ux/api-token-auth/`,
      {
        username: EVEREST_USERNAME,
        password: EVEREST_PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.data?.token) {
      throw new Error("Token not found in response");
    }

    return response.data.token;
  } catch (error) {
    throw new Error("Everest authentication failed");
  }
}

function InsertData(json, CollectionName, db) {
  if (json._id) {
    delete json._id;
  }
  let i = 0;
  return new Promise(async (resolve) => {
    let result = await db.collection(CollectionName).insertOne(json);
    resolve(result);
    i++;
  });
}

async function syncEverestIncidents(clientCtx) {
  try {
    const limit = 10000;
    const allIncidents = [];
    let totalCount = null;
    let offset = 0;
    let page = 1;
    let totalProcessed = 0;

    const orgDoc = await clientCtx.db
      .collection("everestIncidentOrganizations")
      .findOne({});

    const allowedOrganizations = new Set(
      (orgDoc?.organization || []).map(org => org.trim())
    );

    if (!allowedOrganizations.size) {
      console.log("No organizations found, skipping sync");
      return;
    }

    const prioritySummary = {};
    const statusSummary = {};
    const stateSummary = {};

    const timestamp = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            Math.floor(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );

    while (true) {
      const token = await getAuthToken(clientCtx);
      let url = `${EVEREST_API_URL}/ux/sd/inci/incident/?items_per_page=${limit}&page=${page}`;

      if (page > 1) {
        offset = (page - 1) * limit;
        url += `&offset=${offset}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const { results = [], count } = response.data || {};

      if (totalCount === null && typeof count === "number") {
        totalCount = count;
      }

      if (!results.length) break;

      for (const incident of results) {

        const orgName =  incident?.basic_info?.catalogue_name || "";

        // ❌ Skip if organization not allowed
        if (!allowedOrganizations.has(orgName)) {
          continue;
        }

        const priority = incident.priority_name || "Unknown";
        prioritySummary[priority] =
          (prioritySummary[priority] || 0) + 1;
        statusSummary[incident.status_name] = (statusSummary[incident.status_name] || 0) + 1;
        stateSummary[incident.state_name] = (stateSummary[incident.state_name] || 0) + 1;

        allIncidents.push({
          displayId: incident.display_id || "",
          summary: incident.summary || "",
          description: incident.description || "",
          impact_service_name: incident.impact_service_name || "",
          service_classification_name:
            incident.service_classification_name || "",
          state: incident.state || "",
          status: incident.status || "",
          stateName: incident.state_name || "",
          statusName: incident.status_name || "",
          urgency: incident.urgency_name || "",
          priority: incident.priority_name || "",
          impact: incident.impact_name || "",
          severity: incident.severity_name || "",
          organizationName: incident.requester.organization_name || "",
          requester_email: incident.requester_email || "",
          requester_name: incident.requester_name || "",
          requester_phone: incident.requester_phone || "",
          closureInfo: incident.closure_info || {},
          assignmentInfo: incident.assignment_info || {},
          slaInfo: incident.sla_info || {},
          sourceName: incident.source_name || "",
          sla: incident.sla || {},
          creationTime: incident.creation_time
            ? new Date(incident.creation_time)
            : timestamp,
          catalogueName: incident?.basic_info?.catalogue_name  || "",
        });


        totalProcessed++;
      }

      if (totalCount !== null && totalProcessed >= totalCount) {
        break;
      }

      page++;
    }

    const incidentSummary = {
      timestamp,
      data: {
        priority: prioritySummary,
        state: stateSummary,
        status: statusSummary
      }
    };

    const incidents = {
      timestamp,
      data: allIncidents,
    };

    const priority = await InsertData(
      incidentSummary,
      "everestIncidentSummary",
      clientCtx.db
    );

    console.log("priority", priority)

    const all = await InsertData(
      incidents,
      EVEREST_INCIDENT_COLLECTION,
      clientCtx.db
    );

    console.log(all)

    console.log(
      `Everest incident sync completed. Total processed: ${totalProcessed}`
    );
  } catch (error) {
    console.error(
      "Everest incident sync failed",
      error.response?.data || error.message
    );
  }
}

async function syncEverestIndividualIncidents(clientCtx) {
  try {
    const limit = 100;
    let totalCount = null;
    let offset = 0;
    let page = 1;
    let totalProcessed = 0;

    const orgDoc = await clientCtx.db
    .collection("everestIncidentOrganizations")
    .findOne({});

  const allowedOrganizations = new Set(
    (orgDoc?.organization || []).map(org => org.trim())
  );

  if (!allowedOrganizations.size) {
    console.log("No organizations found, skipping sync");
    return;
  }

    const timestamp = new Date(
      new Date(
        new Date(
          new Date(Date.now()).setMinutes(
            Math.floor(new Date(Date.now()).getMinutes() / 5) * 5
          )
        ).setSeconds(0)
      ).setMilliseconds(0)
    );

    while (true) {
      const token = await getAuthToken(clientCtx);
      let url = `${EVEREST_API_URL}/ux/sd/inci/incident/?items_per_page=${limit}&page=${page}`;

      if (page > 1) {
        offset = (page - 1) * limit;
        url += `&offset=${offset}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const { results = [], count } = response.data || {};

      if (totalCount === null && typeof count === "number") {
        totalCount = count;
      }

      if (!results.length) break;

      const bulkOps = [];

      for (const incident of results) {
        const orgName =  incident?.basic_info?.catalogue_name || "";

        // ❌ Skip if organization not allowed
        if (!allowedOrganizations.has(orgName)) {
          continue;
        }

        const incidentDoc = {
          displayId: incident.display_id || "",
          summary: incident.summary || "",
          description: incident.description || "",
          impact_service_name: incident.impact_service_name || "",
          service_classification_name: incident.service_classification_name || "",
          state: incident.state || "",
          status: incident.status || "",
          stateName: incident.state_name || "",
          statusName: incident.status_name || "",
          urgency: incident.urgency_name || "",
          priority: incident.priority_name || "",
          impact: incident.impact_name || "",
          severity: incident.severity_name || "",
          organizationName: incident.requester?.organization_name || "",
          requester_email: incident.requester_email || "",
          requester_name: incident.requester_name || "",
          requester_phone: incident.requester_phone || "",
          closureInfo: incident.closure_info || {},
          assignmentInfo: incident.assignment_info || {},
          slaInfo: incident.sla_info || {},
          sourceName: incident.source_name || "",
          sla: incident.sla || {},
          creationTime: incident.creation_time
            ? new Date(incident.creation_time)
            : timestamp,
          catalogueName: incident?.basic_info?.catalogue_name || "",
        };

        bulkOps.push({
          updateOne: {
            filter: { displayId: incidentDoc.displayId },
            update: { $set: incidentDoc },
            upsert: true,
          },
        });

        totalProcessed++;
      }

      if (bulkOps.length) {
        await clientCtx.db
          .collection("everestIndividualIncidents")
          .bulkWrite(bulkOps, { ordered: false });
      }

      if (totalCount !== null && totalProcessed >= totalCount) {
        break;
      }

      page++;
    }


    console.log(
      `Everest Individual incident sync completed. Total processed: ${totalProcessed}`
    );
  } catch (error) {
    console.error(
      "Everest individual incident sync failed",
      error.response?.data || error.message
    );
  }
}
module.exports = { syncEverestIncidents , syncEverestIndividualIncidents };