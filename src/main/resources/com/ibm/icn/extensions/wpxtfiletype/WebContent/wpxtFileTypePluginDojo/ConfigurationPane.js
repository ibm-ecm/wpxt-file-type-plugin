/**
 * Copyright 2017 IBM Corporation
 */
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dojo/Deferred",
    "dijit/_TemplatedMixin",
    "ecm/model/Request",
    "ecm/model/Message",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/dom",
    "dojo/dom-construct",
    "dijit/form/Select",
    "ecm/widget/admin/PluginConfigurationPane",
    "wpxtFileTypePluginDojo/Constants",
    "wpxtFileTypePluginDojo/admin/RepoManager",
    "dojo/i18n!./nls/messages",
    "dojo/text!./templates/ConfigurationPane.html"
], function (
    declare,
    lang,
    array,
    on,
    Deferred,
    _TemplatedMixin,
    Request,
    Message,
    _WidgetsInTemplateMixin,
    dom,
    domConstruct,
    Select,
    PluginConfigurationPane,
    Constants,
    RepoManager,
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
             * The current repo selected if any, which possibiliy isn't connect (.connected)
             * @type {ecm.model.Repository} 
             * @private
             */
            _currentRepo: null,
            /**
             * A map of WorkplaceXT ID (as key) associated to their value (object {id: string, name: string})
             * @type {Object.<string, {id: string, name: string}>} 
             * @private
             */
            _filetypes: null,
            /**
             * RepoManager to access repository from both Admin and Normal desktop
             * @type {wpxtFileTypePluginDojo.admin.RepoManager} 
             * @private
             */
            _repoManager: null,
            /**
             * Save the fact than the current repository is not connected and mapping can't be loaded
             * @type {boolean} 
             * @private
             */
            _valid: true,
            
            /**
             * Init select on Post Create
             * @override
             */
            postCreate: function () {
                this.inherited(arguments);
                this._repoManager = new RepoManager();
                this._filetypes = {};
            },

            /**
             * Load config
             * @override
             */
            load: function (/* callback */) {
                this._initRepo().then(lang.hitch(this, function () {
                    var currentConf;
                    if (this.configurationString) {
                        // Init from configuration
                        currentConf = JSON.parse(this.configurationString);
                        var repo = currentConf[Constants.CONFIG_REPOSITORY_ID_KEY];
                        this.setSelect(this.repositoryIdField, repo);
                        this.prefPathField.set('value', currentConf[Constants.CONF_PREFERENCES_PATH]);
                    } else {
                        // Persist default values to configuration
                        currentConf = this._persist();
                    }
                    // Find the repository object from the idea and make sure it's connected (if admin desktop)
                    // so we can load the mapping from it
                    this._findRepo().then(lang.hitch(this, function () {
                        this._loadMapping(currentConf);
                    }), lang.hitch(this, function () {
                        // Not logged in, do nothing _valid is already to false
                    }));
                    
                }));
            },
            
            /**
             * Init the drop down list of P8 repositories
             * @private
             */
            _initRepo: function () {
                var data = [], first = true, res = new Deferred();
                this._repoManager.getRepositories().then(lang.hitch(this, function (repositories) {
                    this._repositories = repositories;
                    array.forEach(repositories, function (repo) {
                        if (first) {
                            data.push({ value: repo.id, label: repo.name, selected: true});
                            first = false;
                        } else {
                            data.push({ value: repo.id, label: repo.name, selected: false});
                        }
                    });
                    this.repositoryIdField.addOption(data);
                    res.resolve();
                }));
                return res.promise;
            },
            _findRepo: function () {
                var res = new Deferred();
                var repoId = this.repositoryIdField.get('value');
                this._repoManager.getRepositories().then(lang.hitch(this, function (repositories) {
                    this._currentRepo = null;
                    array.some(repositories, (lang.hitch(this, function (e) {
                        if (e.id == repoId) {
                            this._currentRepo = e;
                            return true;
                        } else {
                            return false;
                        }
                    })));
                    
                    if (this._currentRepo) {
                        this._valid = true;
                        if (this._currentRepo.connected) {
                            res.resolve();
                        } else {
                            this._repoManager.connectRepo(this._currentRepo).then(lang.hitch(this, function () {
                                res.resolve();
                            }), lang.hitch(this, function () {
                                this._valid = false;
                                res.reject();
                            }));
                        }
                    } else {
                        this._valid = false;
                        res.reject();
                    }
                }));
                return res.promise;
            },
            _onRepoChange: function () {
                this._findRepo().then(lang.hitch(this, function () {
                    this._configChangedImplyingReload();
                }), lang.hitch(this, function () {
                    // Not logged in, do nothing _valid is already to false
                }));
            },
            /**
             * Load the mapping from the configuration
             * @param {object} jsonConfig Hte configuration already parsed as an JSON object
             */
            _loadMapping: function (jsonConfig) {
                
                this.logDebug("_loadMapping", 'Loading WPXT File Types...');

                this._allSelects = {};
                this._filetypes = {};
                var serviceParams = {};
                serviceParams[Constants.PARAM_MAP_KEY] = false;

                // To speed up the process and save people of saving twice, also give the current config
                // as param so it doesn;t have to be saved in the config
                serviceParams[Constants.PARAM_CONFIG] = JSON.stringify(jsonConfig);

                Request.invokePluginService(Constants.PLUGIN_ID, Constants.SERVICE_FETCH_XPXT_FT, {
                    requestParams : serviceParams,
                    requestCompleteCallback: lang.hitch(this, function (response) {

                        this.logDebug("_loadMapping", "retrieving WPXT FT OK");
                        if (response.filetypes) {

                            var currentMapping = jsonConfig && jsonConfig[Constants.CONFIG_MAPPING_KEY] ? jsonConfig[Constants.CONFIG_MAPPING_KEY] : {};

                            // Build ICN file type datastore
                            var data = [{label: '', value: 'none'}];
                            array.forEach(ecm.model.desktop.fileTypes, function (el) {
                                var fileType = el._attributes;
                                data.push({label: fileType.name, value: fileType.name});
                            });

                            var div = dom.byId("mappingParam");

                            domConstruct.empty(div);

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

                            this._persist();

                        } else {
                            this.logError("_loadMapping", "Error when retrieving File Type in the FileTypeFixPlugin");
                        }

                    })
                });
                
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
                on(select, "change", lang.hitch(this, this._onMappingChange));
                   
                return select;
            },
            _onMappingChange: function () {
                this._persist();
                this.onSaveNeeded(true);
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
            _configChangedImplyingReload: function () {
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
                return this._valid;
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
            }
        });
    });