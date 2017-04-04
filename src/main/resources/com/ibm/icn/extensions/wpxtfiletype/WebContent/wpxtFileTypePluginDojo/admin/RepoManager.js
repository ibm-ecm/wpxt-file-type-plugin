/**
 * Copyright 2017 IBM Corporation
 */
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/Deferred",
    "dojo/promise/all",
    "ecm/model/Repository",
    "ecm/widget/admin/AdminLoginDialog"
], function (
    declare,
    lang,
    array,
    Deferred,
    all,
    Repository,
    AdminLoginDialog
) {
    
    /**
     * @name recycleBinPluginDojo.RepoManage
     * @since 1.0.1
     * @class A class to manage repository connection from the configuration pannel, being able to deal with
     *        admin desktop or normal desktop
     */
    return declare([], {
        
        /**
         * Returns all repositories as a promise
         * @param   {boolean}      connectAll If <code>true</code>, pre-connect all the repository
         * @returns {dojo.Promise} The promise resolbing to an array of ecm.model.Repository
         */
        getRepositories: function(connectAll) {
            var res = new Deferred();
            if (this._repositories) {
                res.resolve(this._repositories);
            } else {
                if (ecm.model.desktop.id != 'admin') {
                    res.resolve(ecm.model.desktop.repositories);
                } else {
                    ecm.model.admin.adminData.loadRepositories(lang.hitch(this, function(reposObjects) {
                        this._repositories = [];
                        var promises = [];
                        array.forEach(reposObjects.repositories, lang.hitch(this, function (repo) {
                            var repository = new Repository({
                                id: repo.id,
                                name: repo.getName(),
                                type: repo.getType(),
                                connected: false,
                                logonParams: {
                                    displayName: repo.getName(),
                                    serverName:  repo.getServerName(),
                                    objectStore: repo.getObjectStore(),
                                    objectStoreDisplayName: repo.getObjectStoreDisplayName(),
                                    protocol: repo.getProtocol()
                                }
                            });
                            this._repositories.push(repository);
                            if (connectAll) {
                                promises.push(this.connectRepo(repository));
                            }
                        }));
                        all(promises).then(lang.hitch(this, function () {
                            res.resolve(this._repositories);
                        }));
                    }));
                }
            }
            return res.promise;
		},
        
        /**
         * Connect a repository
         * @param   {ecm.model.Repository} repository The unconnected repository to connect
         * @returns {dojo.Promise}         The promise resolving when the repository is connected
         */
        connectRepo: function(repository) {
            var res = new Deferred();
			if (this._loginDialog) {
				this._loginDialog.destroyRecursive();
			}

			this._loginDialog = new AdminLoginDialog({
                onCancel: function () {
                    res.reject();
                }
            });

			this._loginDialog.show(repository.type, repository.id, repository.name, repository.logonParams, lang.hitch(this, function(response) {
				if (response) {
					repository._loadRepository(response);
                    repository.connected = true;
                    res.resolve(repository);
				} else {
                    res.reject();
                }
			}));
            return res.promise;
		}
        

    });
    
});