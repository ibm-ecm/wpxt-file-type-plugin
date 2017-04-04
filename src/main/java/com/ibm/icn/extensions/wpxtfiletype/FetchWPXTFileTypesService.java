/**
 * Copyright 2017 IBM Corporation
 */
package com.ibm.icn.extensions.wpxtfiletype;

import java.util.Collection;

import javax.security.auth.Subject;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.filenet.api.core.ObjectStore;
import com.filenet.api.util.UserContext;
import com.ibm.ecm.extension.PluginService;
import com.ibm.ecm.extension.PluginServiceCallbacks;
import com.ibm.ecm.json.JSONMessage;
import com.ibm.ecm.json.JSONResponse;
import com.ibm.icn.extensions.wpxtfiletype.wpxt.WPXTPreferences;
import com.ibm.icn.extensions.wpxtfiletype.wpxt.WPXTPreferences.FileType;
import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONObject;

/**
 * Provides an abstract class that is extended to create a class implementing
 * each service provided by the plug-in. Services are actions, similar to
 * servlets or Struts actions, that perform operations on the IBM Content
 * Navigator server. A service can access content server application programming
 * interfaces (APIs) and Java EE APIs.
 * <p>
 * Services are invoked from the JavaScript functions that are defined for the
 * plug-in by using the <code>ecm.model.Request.invokePluginService</code>
 * function.
 * </p>
 * Follow best practices for servlets when implementing an IBM Content Navigator
 * plug-in service. In particular, always assume multi-threaded use and do not
 * keep unshared information in instance variables.
 * 
 * @author Guillaume Delory
 * 
 * Feb 15, 2017
 * @copyright IBM 2017
 */
public class FetchWPXTFileTypesService  extends PluginService {

	/**
	 * Returns the unique identifier for this service.
	 * <p>
	 * <strong>Important:</strong> This identifier is used in URLs so it must
	 * contain only alphanumeric characters.
	 * </p>
	 * 
	 * @return A <code>String</code> that is used to identify the service.
	 */
	public String getId() {
		return Constants.SERVICE_FETCH_XPXT_FT;
	}

	/**
	 * Returns the name of the IBM Content Navigator service that this service
	 * overrides. If this service does not override an IBM Content Navigator
	 * service, this method returns <code>null</code>.
	 * 
	 * @returns The name of the service.
	 */
	public String getOverriddenService() {
		return null;
	}

	/**
	 * Performs the action of this service.
	 * 
	 * @param callbacks
	 *            An instance of the <code>PluginServiceCallbacks</code> class
	 *            that contains several functions that can be used by the
	 *            service. These functions provide access to the plug-in
	 *            configuration and content server APIs.
	 * @param request
	 *            The <code>HttpServletRequest</code> object that provides the
	 *            request. The service can access the invocation parameters from
	 *            the request.
	 * @param response
	 *            The <code>HttpServletResponse</code> object that is generated
	 *            by the service. The service can get the output stream and
	 *            write the response. The response must be in JSON format.
	 * @throws Exception
	 *             For exceptions that occur when the service is running. If the
	 *             logging level is high enough to log errors, information about
	 *             the exception is logged by IBM Content Navigator.
	 */
	public void execute(PluginServiceCallbacks callbacks,
			HttpServletRequest request, HttpServletResponse response)
			throws Exception {
	    
	    JSONResponse jsonResults = new JSONResponse();
	    
	    JSONObject conf;
	    String currentConf = request.getParameter(Constants.PARAM_CONFIG);
	    String mapS = (String) request.getParameter(Constants.PARAM_MAP_KEY);
	    
	    
	    boolean map = true;
	    if (mapS != null && !"".equals(mapS)) {
	        map = Boolean.parseBoolean(mapS);
	    }
	    
	    String configuration = callbacks.loadConfiguration();
	    // If we are in the configuration panel (!map) asking for mapping, use current unsaved values
	    if (!map && currentConf != null && !currentConf.isEmpty()) {
	    	conf = JSONObject.parse(currentConf);
	    } else if (configuration != null && !configuration.isEmpty()) {
	    	 conf = JSONObject.parse(configuration);
	    } else {
	    	 conf = new JSONObject();
	    }
	    JSONObject mapping = (JSONObject) conf.get(Constants.CONFIG_MAPPING_KEY);
	    
	    
        if (map) {
        	if (mapping != null) {
        		jsonResults.put("filetypes", mapping);
        	}
        } else {
            getValueFromWorkplaceXT(callbacks, jsonResults, conf);
        }
	    
	    jsonResults.serialize(response.getOutputStream());
        callbacks.getLogger().logExit(this, "execute", request);
	}

    private void getValueFromWorkplaceXT(PluginServiceCallbacks callbacks, JSONResponse jsonResults, JSONObject conf) {
        
        String repositoryId = (String) conf.get(Constants.CONF_REPOSITORY_ID_KEY);
        String preferencesPath = (String) conf.get(Constants.CONF_PREFERENCES_PATH);

        if (repositoryId != null && !repositoryId.isEmpty() ||
                preferencesPath != null && !preferencesPath.isEmpty()) {
            
            Subject subject = callbacks.getP8Subject(repositoryId);
            UserContext.get().pushSubject(subject);
            try {
                ObjectStore os = callbacks.getP8ObjectStore(repositoryId);
                
                if (os == null) {
                    jsonResults.addErrorMessage(new JSONMessage(0, "FileTypeFixPlugin configuration error", 
                            "Repository " + repositoryId + " does not exist, please check the configuration", 
                            "", "", null));
                } else {
                    WPXTPreferences prefs = new WPXTPreferences(callbacks.getP8ObjectStore(repositoryId), callbacks.getLogger());
                    if (prefs.loadPreferences(preferencesPath)) {
                        Collection<FileType> fileTypes = prefs.getFileTypes();
                        JSONArray allFT = new JSONArray();
                        JSONArray mimetypes;
                        JSONObject fileTypeJSON;
                        for (FileType fileType : fileTypes) {
                            fileTypeJSON = new JSONObject();
                            mimetypes = new JSONArray();
                            mimetypes.addAll(fileType.mimetypes);
                            fileTypeJSON.put("id", fileType.id);
                            fileTypeJSON.put("name", fileType.name);
                            fileTypeJSON.put("mimetypes", mimetypes); 
                            allFT.add(fileTypeJSON);
                        }
                        jsonResults.put("filetypes", allFT);
                    } else {
                        jsonResults.addErrorMessage(new JSONMessage(0, "FileTypeFixPlugin configuration error", 
                                "Can not load the Workplace XT preferences document", "", preferencesPath + " does not seem like a valid location", null));
                    }
                }
            } catch (Exception e) {
                jsonResults.addErrorMessage(new JSONMessage(0, "FileTypeFixPlugin unexpected error", 
                        e.getMessage(), "", "", null));
            } finally {
                UserContext.get().popSubject();
            }
        }
        
    }
}
