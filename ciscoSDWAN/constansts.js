const Constants = {
    
    // Reports/Device Inventory
    DEVICE_INVENTORY_FMT: "YYYY-MM-DDTHH:mm:ss.000+0000",

    // TIME FORMAT Constants
    TIME_FORMAT: '%d-%b-%Y %H:%M:%S.%f',

    // Scheduler collections
    COLLECTION_SDWAN_DEVICE_HEALTH: 'sdwan_scheduled_device_health',
    COLLECTION_LINK_PERFORMANCE: 'sdwan_link_performance',
    COLLECTION_SITE_TUNNEL: 'sdwan_site_tunnel',
    COLLECTION_LINK_MOST_USES: 'sdwan_link_most_uses',
    COLLECTION_TOP_UTILIZED_APPS: 'sdwan_scheduled_top_utilized_apps',
    COLLECTION_ALARM_TABLE: 'sdwan_alarm_table',
    COLLECTION_INTRUSION_PREVENTION: 'sdwan_intrusion_prevention',
    COLLECTION_SCHEDULED_INVENTORY_TABLE: 'sdwan_scheduled_inventory_table',
    COLLECTION_INVENTORY_TABLE: 'sdwan_inventory_table',

    // Site Health Details
    REPLACE_STR: ['-internet', 'internet'],
    BFD_SESSIONS_FILTER_LIST: ['(', ')'],

    // Intrusion Prevention Alert Time Format
    IPS_TIME_FORMAT: "%m/%d/%Y %H:%M",
    IPS_TIME_FORMAT_SEC: "MM/DD/YYYY HH:mm",

    // Location Map Time Format
    LM_TIME_FORMAT: "%d/%m/%Y %H:%M:%S",

    // Scheduler entry date format
    ENTRY_DATE: 'MM/DD/YYYY',

    // Analytics current time format. Note: Year (Y - 2022, y - 22)
    ANALYTICS_CURRENT_TIME: '%m/%d/%y',

    // Timestamp match
    DB_MATCH_TIMESTAMP: '%Y-%m-%dT%H:%M:%S.%f%z',
    TIMEZONE_DIFF: 0.0,

    // Dashboard last updated date format
    LAST_UPDATED_FMT: '%b %d, %Y',
    SPLIT_TEXT_NAME:/;|,|\||\:|\-/,
    COMMAN_TIME_FORMAT: "YYYY-MM-DDTHH:mm:ss.000+0000",
    TOPOLOGY_TIME_FORMAT : "YYYY-MM-DD HH:mm:ss",
};

module.exports = Constants;
