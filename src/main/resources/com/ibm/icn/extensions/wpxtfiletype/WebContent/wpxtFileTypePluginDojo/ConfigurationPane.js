/**
 * Copyright 2017 IBM Corporation
 */
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dijit/_TemplatedMixin",
    "ecm/model/Request",
    "ecm/model/Message",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/dom",
    "dojo/dom-construct",
    "dijit/form/Select",
    "ecm/widget/admin/PluginConfigurationPane",
    "wpxtFileTypePluginDojo/Constants",
    "dojo/i18n!./nls/messages",
    "dojo/text!./templates/ConfigurationPane.html"
], function (
    declare,
    lang,
    array,
    on,
    _TemplatedMixin,
    Request,
    Message,
    _WidgetsInTemplateMixin,
    dom,
    domConstruct,
    Select,
    PluginConfigurationPane,
    Constants,
    mes,
    template
) {

        return declare([PluginConfigurationPane, _TemplatedMixin, _WidgetsInTemplateMixin], {

            messages: mes,
            templateString: template,
            widgetsInTemplate: true,
            /**
             * map keeping track of the Drop Down select associated to their Workplace XT File Type Category ID
             * @type {Object.<string, dijit.form.Select>} 
             * @private
             */
            _allSelects: null,
            /**
             * <code>true</code> if the mapping has been loaded, <code>false</code>
             * @type {boolean} 
             * @private
             */
            _mappingLoaded: false,
            /**
             * A map of WorkplaceXT ID (as key) associated to their value (object {id: string, name: string})
             * @type {Object.<string, {id: string, name: string}>} 
             * @private
             */
            _filetypes: null,
            
            /**
             * Init select on Post Create
             * @override
             */
            postCreate: function () {
                this.inherited(arguments);
                this._filetypes = {};
                this._initRepo();
            },

            /**
             * Load config
             * @override
             */
            load: function (/* callback */) {
                // The auto-load does not work from the admin desktop
                if (ecm.model.desktop.id == 'admin') {
                    ecm.model.desktop.addMessage(new Message({
                        number: 0,
                        level: 3,
                        text: this.messages.adminDesktopWarning,
                        backgroundRequest: false
                    }));
                }
                
                if (this.configurationString) {
                    var jsonConfig = JSON.parse(this.configurationString);
                    
                    var repo = jsonConfig[Constants.CONFIG_REPOSITORY_ID_KEY];
                    this.setSelect(this.repositoryIdField, repo);
                    this.prefPathField.set('value', jsonConfig[Constants.CONF_PREFERENCES_PATH]);
                    
                    if (this.isObjectStoreValid(repo) && ecm.model.desktop.id != 'admin') {
                        this._loadMapping(jsonConfig);
                    } else {
                        this.mappingParam.innerHTML = this.messages.mappingSaveTwice;
                    }
                } else {
                    this.mappingParam.innerHTML = this.messages.mappingSaveTwice;
                }
            },
            
            /**
             * Init the drop down list of P8 repositories
             * @private
             */
            _initRepo: function () {
                var data = [], first = true;
                array.forEach(ecm.model.desktop.repositories, function (repo) {
                    if (repo.type == "p8") {
                        if (first) {
                            data.push({ value: repo.id, label: repo.name, selected: true});
                            first = false;
                        } else {
                            data.push({ value: repo.id, label: repo.name, selected: false});
                        }
                    }
                });
                this.repositoryIdField.addOption(data);

            },
            /**
             * Load the mapping from the configuration
             * @param {object} jsonConfig Hte configuration already parsed as an JSON object
             */
            _loadMapping: function (jsonConfig) {
                
                if (!this._mappingLoaded) {
                    this.logDebug("_loadMapping", 'Loading WPXT File Types...');
                
                    this._allSelects = {};
                    this._filetypes = {};
                    var serviceParams = {};
                    serviceParams[Constants.PARAM_MAP_KEY] = false;

                    Request.invokePluginService(Constants.PLUGIN_ID, Constants.SERVICE_FETCH_XPXT_FT, {
                        requestParams : serviceParams,
                        requestCompleteCallback: lang.hitch(this, function (response) {

                            this.logDebug("_loadMapping", "retrieving WPXT FT OK");
                            if (response.filetypes) {

                                this._mappingLoaded = true;
                                this.onSaveNeeded(true);

                                var currentMapping = jsonConfig && jsonConfig[Constants.CONFIG_MAPPING_KEY] ? jsonConfig[Constants.CONFIG_MAPPING_KEY] : {};
                                
                                // Build ICN file type datastore
                                var data = [{label: '', value: 'none'}];
                                array.forEach(ecm.model.desktop.fileTypes, function (el) {
                                    var fileType = el._attributes;
                                    data.push({label: fileType.name, value: fileType.name});
                                });

                                var div = dom.byId("mappingParam");

                                var table = domConstruct.place("<table>", div);
                                domConstruct.place("<tr><td>" + this.messages.wpxtCategory + "</td><td>" + this.messages.icnFileType + "</td></tr>", table);

                                // Add one row per WPXT filetype
                                array.forEach(response.filetypes, lang.hitch(this, function (fileType) {
                                    this._filetypes[fileType.id] = fileType;

                                    var tr =  domConstruct.place("<tr>", table);

                                    domConstruct.place("<td class='mappingLabel'>" + fileType.name + "</td>", tr);

                                    var newData = JSON.parse(JSON.stringify(data));

                                    var select = this.initSelect(fileType, newData, currentMapping);

                                    var td = domConstruct.place("<td>", tr);
                                    domConstruct.place(select.domNode, td);
                                }));
                                
                                // Save this default mapping
                                var configJson = {};
                                configJson[Constants.CONFIG_REPOSITORY_ID_KEY] = this.repositoryIdField.get('value');
                                configJson[Constants.CONF_PREFERENCES_PATH] = this.prefPathField.get('value');
                                configJson[Constants.CONFIG_MAPPING_KEY] = this.saveMapping();
                                this.configurationString = JSON.stringify(configJson);
                                this.onSaveNeeded(true);
                                this._loadMapping(configJson);
                                
                                this.saveMapping();
                                this._persist();

                            } else {
                                this.logError("_loadMapping", "Error when retrieving File Type in the FileTypeFixPlugin");
                            }

                        })
                    });
                }
                
            },
            /**
             * Init the select with the correct value selected (either auto-mapping 
             * or what was previsouly selected if any)
             * @param   {id: string, name: string}        fileType       The Workplace XT FileType
             * @param   {label: string, value: string}[]  newData        The ICN File Types as a datastore for the select
             * @param   {Object.<string, string>}         currentMapping Current mapping as a map <wpxtId, ICN File Type>
             * @returns {dijit.form.Select}               The Drop Down select
             */
            initSelect: function (fileType, newData, currentMapping) {
                
                this.findICNequivalent(currentMapping[fileType.id] || fileType.name, newData);

                var select = new Select({
                    name: fileType.id,
                    options: newData,
                    "class": "mappingValue"
                });
                select.startup();
                
                this._allSelects[fileType.id] = select;
                on(select, "change", lang.hitch(this, this._onParamChange));
                   
                return select;
            },
            /**
             * Try to map (select in the datastore) automatically by finding an ICN File Type with 
             * the same name as the Workplace XT File Type Catagory's label
             * @param {string}                          wpxt               The Workplace XT File Type Category's label
             * @param {label: string, value: string}[] icnFiletypesOptions The datastore of the ICN File Types
             */
            findICNequivalent: function (wpxt, icnFiletypesOptions) {
                array.forEach(icnFiletypesOptions, function (option) {
                    option.selected = (option.value == wpxt);
                });
            },
            /**
             * Save the current configuration to the persisted string (<code>this.configurationString</code>)
             * @private
             * @returns {object} The saved configuration as a JSON Object
             */
            _persist: function () {
                var configJson = {};
                configJson[Constants.CONFIG_REPOSITORY_ID_KEY] = this.repositoryIdField.get('value');
                configJson[Constants.CONF_PREFERENCES_PATH] = this.prefPathField.get('value');
                configJson[Constants.CONFIG_MAPPING_KEY] = this.saveMapping();
                this.configurationString = JSON.stringify(configJson);
                return configJson;
            },
            /**
             * This is called when any field is changing
             * @private
             */
            _onParamChange : function () {
                var configJson = this._persist();
                this.onSaveNeeded(true);
                this._loadMapping(configJson);
            },
            /**
             * @return {Object.<string, string>} the current mapping to be persisted as a map <wpxtId, ICN File Type>
             */
            saveMapping: function () {
                var mapping = {}, wpxtId;
                for (wpxtId in this._allSelects) {
                    var select = this._allSelects[wpxtId];
                    if (this._allSelects.hasOwnProperty(wpxtId)) {
                        if (select.get('value') != 'none') {
                            mapping[wpxtId] = select.get('value');
                        } else {
                            mapping[wpxtId] = this._filetypes[wpxtId] ? this._filetypes[wpxtId].name : wpxtId;
                        }
                    }
                }
                return mapping;
                
            },
            /**
             * Validate the selected configuration
             * @override
             */
            validate: function () {
                if (!this.isObjectStoreValid(this.repositoryIdField.get('value'))) {
                    return false;
                }
                return true;
            },
            /**
             * Select the given value in the given {dijit.form.Select}, or first if not found
             * @param {dijit.form.Select} select The drop down select
             * @param {string}            value  the value to look for
             */
            setSelect: function (select, value) {
                var found = false;
                array.forEach(select.options, function (option) {
                    if (option.value == value) {
                        option.selected = true;
                        found = true;
                    } else {
                        option.selected = false;
                    }
                });
                if (!found && select.options && select.options.length > 0) {
                    select.options[0].select = true;
                }
            },
            /**
             * Check if the Object Store exists in ICN
             */
            isObjectStoreValid: function (value) {
                return array.some(ecm.model.admin.appCfg._attributes.repositories, function (el) {
                    return el == value;
                });
            },
            // Override
            save: function (/* onComplete */) {
                // Reload mapping on save if not loaded yet
                // This is happening at install time when this could not
                // be loaded becausee no OS was selected
                if (this.configurationString && this.configurationString.length > 0) {
                    var jsonConfig = JSON.parse(this.configurationString);
                    this._loadMapping(jsonConfig);
                }
            }
        });
    });