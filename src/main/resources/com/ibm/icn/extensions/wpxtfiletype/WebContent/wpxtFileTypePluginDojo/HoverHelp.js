/**
 * Copyright 2017 IBM Corporation
 */
define([
    "dojo/_base/declare",
    "ecm/widget/HoverHelp",
    "dojo/i18n!./nls/messages",
], function (
    declare,
    HoverHelp,
    mes
) {
    /**
     * Our own HoverHelp, extending ecm/widget/HoverHelp only to use our own resources
     */
    return declare([HoverHelp], {
        resources: mes,
        baseHref: null,
        
        constructor: function () {
        },
        
        postCreate: function () {
            this.baseHref = this.resources.baseHelpHref;
        }
	});
});
