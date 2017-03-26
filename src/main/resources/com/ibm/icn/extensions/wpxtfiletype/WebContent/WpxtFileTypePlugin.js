/**
 * Copyright 2017 IBM Corporation
 */
require([
    "dojo/_base/array",
    "dojo/aspect",
    "ecm/model/Request",
    "ecm/model/Repository",
    "ecm/LoggerMixin",
    "wpxtFileTypePluginDojo/Constants"
], function (
    array,
    aspect,
    Request,
    Repository,
    LoggerMixin,
    Constants
) {
    /**
     * Use this function to add any global JavaScript methods your plug-in requires.
     */
    
    var signalFileTypeFixPlugin = null;
    var logger = new LoggerMixin();
    
    /**
     * Inject the mapping so it can be used to translate File Types
     * every time an Entry Template is retrieved from the server.
     * @private
     * @param {object} fileTypeMapping mapping Wpxt File Type Category's ID <--> ICN File Type Filter's name
     */
    var _injectFileTypes = function (fileTypeMapping) {
        logger.logDebug("WpxtFileTypePlugin", "Injecting mapping: ", fileTypeMapping);
        // aspect the retrieve template to change the file type
        aspect.before(Repository.prototype, "_retrieveEntryTemplatesCompleted", function (response) {
            var i, fileTypeId;
            array.forEach(response.datastore.items, function (entryTemplateJSON) {
                for (i = 0; i < entryTemplateJSON.fileTypes.length; i++) {
                    fileTypeId = entryTemplateJSON.fileTypes[i];
                    if (fileTypeMapping[fileTypeId]) {
                        entryTemplateJSON.fileTypes[i] = fileTypeMapping[fileTypeId];
                    }
                }
            });
            
        });
        
        // Execute this method only on the first login
        // No need to aspect multiple times
        if (signalFileTypeFixPlugin) {
            signalFileTypeFixPlugin.remove();
        }
    };
    
    /**
     * Necessary to not invoke this the first time the plugin is installed but not fully loaded
     * @returns {boolean} <code>true</code> if the plugin is already deployed, <code>false</code> otherwise
     */
    var fileTypePluginDeployed = function () {
        var i;
        for (i = 0; i < ecm.model.desktop._plugins.length; i++) {
            if (ecm.model.desktop._plugins[i].id == Constants.PLUGIN_ID) {
                return true;
            }
        }
        return false;
    };

    /**
     * Retrieve the mapping from the server and inject it
     * @private
     */
    var _fetchFileTypes = function () {
        if (fileTypePluginDeployed() && ecm.model.desktop.id != 'admin') {
            logger.logDebug("WpxtFileTypePlugin", 'Login WPXT File Types...');
            Request.invokePluginService(Constants.PLUGIN_ID, Constants.SERVICE_FETCH_XPXT_FT, {
                requestCompleteCallback: function (response) {
                    
                    logger.logDebug("WpxtFileTypePlugin", "retrieving WPXT FT OK", JSON.stringify(response));
                    if (response.filetypes) {
                        // Here we can inject the File Types in the desktop config
                        _injectFileTypes(response.filetypes);
                    } else {
                        logger.logError("WpxtFileTypePlugin", "Error when retrieving File Type in the FileTypeFixPlugin");
                    }

                }
            });
        }
    };

    /**
     * Function called on the onLogin even from desktop
     * @private
     */
    var _onLogin = function (/* repository */) {
        _fetchFileTypes();
    };

    // Either do the aspect to inject file types now if connected, or delayed if not connected yet
    // since we need to be connected to remove the file type mapping
    if (ecm.model.desktop.connected) {
        _fetchFileTypes();
    } else {
        // dojo/on won't work because desktop does not fire events,
        // let use aspect to call our method at the end of the dektop.onLogin
        signalFileTypeFixPlugin = aspect.after(ecm.model.desktop, "onLogin", _onLogin);
    }

});