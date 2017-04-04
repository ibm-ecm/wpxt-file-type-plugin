/**
 * Copyright 2017 IBM Corporation
 */
define([
    "dojo/_base/declare"
], function (
    declare
) {
    
    /**
     * This is a singleton class for constant, equivalence of the com.ibm.icn.extensions.wpxtfiletype.Constants in Java
     */
    var Constants = declare("wpxtFileTypePluginDojo.Constants", [], {
        /** 
         * @type {string}
         * The Plugin Id
         */
        PLUGIN_ID: "WpxtFileTypePlugin",
        /** 
         * @type {string}
         * The service's ID to fetch configuration
         */
        SERVICE_FETCH_XPXT_FT: "FetchWPXTFileTypesService",
        /** 
         * @type {string}
         * The config key for the repository Id
         */
        CONFIG_REPOSITORY_ID_KEY: "repositoryId",
        /** 
         * @type {string}
         * The config key for the mapping
         */
        CONFIG_MAPPING_KEY: "mapping",
        /** 
         * @type {string}
         * The config key for the WPXT Site Preferences document path
         */
        CONF_PREFERENCES_PATH: "prefPath",
        /** 
         * @type {string}
         * The param key to ask for mapping or not
         */
        PARAM_MAP_KEY: "map",
        /** 
         * @type {string}
         * The param key for the current config
         */
        PARAM_CONFIG: "config"
        

    });
    
    // Singleton constructor
    var _instance;
    if (!_instance) {
        _instance = new Constants();
    }
    return _instance;
});