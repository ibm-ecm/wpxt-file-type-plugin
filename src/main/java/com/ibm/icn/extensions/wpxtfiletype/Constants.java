/**
 * Copyright 2017 IBM Corporation
 */
package com.ibm.icn.extensions.wpxtfiletype;

/**
 * 
 * @author Guillaume Delory
 * 
 * Feb 15, 2017
 * @copyright IBM 2017
 *
 */
public class Constants {
	/**
	 * Plug-in's ID
	 */
	public static final String PLUGIN_ID = "WpxtFileTypePlugin";
	/**
	 * The service's ID to fetch configuration
	 */
	public static final String SERVICE_FETCH_XPXT_FT = "FetchWPXTFileTypesService";
	/**
	 * Configuration key used to store the repository ID
	 */
    public static final String CONF_REPOSITORY_ID_KEY = "repositoryId";
    /**
	 * Configuration key used to store the Workplace XT preferences document's path
	 */
    public static final String CONF_PREFERENCES_PATH = "prefPath";
    /**
	 * Configuration key used to store the mapping between file types
	 */
    public static final String CONFIG_MAPPING_KEY = "mapping";
    /**
	 * Parameter key used to send the mapping
	 */
    public static final String PARAM_MAP_KEY = "map";
}
