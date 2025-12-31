const ApiUrls = {
    // Apis request making settings.
    VERIFY_REQUEST: false,
    REQUEST_TIMEOUT: 10,

    // *****************************************************************************************************

    // Login APIs URLs.
    LICENSE_URL_IP: "192.168.100.183",

    // *****************************************************************************************************

    // URLs common to most APIs after user login.
    J_SECURITY_CHECK_URL: "/j_security_check",
    TOKEN_URL: "/dataservice/client/token",

    // *****************************************************************************************************

    // Dashboard APIs URLs.
    HARDWARE_HEALTH_URL: "/dataservice/device/hardwarehealth/summary?isCached=false",
    REBOOT_DEVICE_URL: "/dataservice/device/reboothistory/details",
    BFD_SITE_SUMMARY_URL: "/dataservice/device/bfd/sites/summary?isCached=false",
    TOTAL_SITES_INFO_URL: "/dataservice/system/device/vedges",
    TOP_APP_USAGE_URL: "/dataservice/statistics/dpi/applications/summary?query=",

    // *****************************************************************************************************

    // Device Inventory API URLs.
    DEVICE_INVENTORY_URL: "/dataservice/device",

    // *****************************************************************************************************

    // Alarm APIs URL.
    ALARMS_URL: "/dataservice/alarms?query=",

    // *****************************************************************************************************

    // Tunnel statistics API URL.
    TUNNEL_SUMMARY_URL: "/dataservice/statistics/approute/tunnels/summary/latency?query=",
    APP_ROUTE_STATISTICS_URL: "/dataservice/statistics/approute/aggregation",

    // *****************************************************************************************************

    // SD-WAN health details URL.
    WAN_HEALTH_URL: "/dataservice/device/system/info?deviceId=",

    // *****************************************************************************************************

    // Site health details URL.
    BFD_DEVICE_URL: "/dataservice/device/bfd/sessions?deviceId=",
    BFD_SITE_UP_URL: "/dataservice/device/bfd/sites/detail?state=siteup",
    BFD_SITE_PARTIAL_URL: "/dataservice/device/bfd/sites/detail?state=sitepartial",
    BFD_SITE_DOWN_URL: "/dataservice/device/bfd/sites/detail?state=sitedown",

    // *****************************************************************************************************

    // Top applications usage by ID.
    APPLICATIONS_BY_ID_URL: "/dataservice/device/dpi/applications?deviceId=",

    // *****************************************************************************************************

    // Intrusion Prevention alert.
    INTRUSION_PREVENTION_ALERT_URL: "/dataservice/statistics/ipsalert?query=",

    // *****************************************************************************************************

    // Top Users.
    TOP_USERS_URL: "/dataservice/statistics/dpi/aggregation",

    // *****************************************************************************************************

    // SD-WAN Topology.
    CONTROLLERS_URL: "/dataservice/system/device/controllers",
    VEDGES_URL: "/dataservice/system/device/vedges",
    DEVICE_CONNECTIONS_URL: "/dataservice/device/control/connections?deviceId=",
    VEDGE_STATUS_URL: "/dataservice/device?personality=vedge&status=normal",

    // *****************************************************************************************************

    // Analytics APIs.
    DATASERVICE_EVENTS: "/dataservice/event/page?query=",
    DATASERVICE_ALARMS: "/dataservice/alarms?count=10000"
};

module.exports = ApiUrls;
