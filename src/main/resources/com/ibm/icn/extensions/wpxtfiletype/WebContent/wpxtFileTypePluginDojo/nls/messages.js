/**
 * Copyright 2017 IBM Corporation
 */
define({

	root: ({

        adminDesktopWarning: 'The mapping can not be configured from the admin desktop because it does not have access to the Workplace XT object Store. Please use the user desktop, logged as administrator to configure this plugin.',
        wpxtCategory: 'Workplace XT File Type Category',
        icnFileType: 'ICN File Type filter',
        objectStore: 'Workplace XT Repository',
        topic_repositoryId_message: 'The repository hosting the Workplace XT preferences, so the plug-in can read the file and help you map.',
        preferenceDocument: 'Workplace XT Preferences document',
        topic_prefPath_message: 'Path of the Workplace XT Site preferences document in the Object Store. Default value should be /Preferences/Site Preferences for WorkplaceXT',
        mapping: 'Mapping',
        mappingNotice: 'The plugin tries to map if names are identical. If they are not, you can map them below. Note that if you do not map any ICN File Type to an Workplace XT File Type, all Entry Template associations made in Workplace XT using the unmapped File Type won\'t work in ICN.',
        
        
        baseHelpHref: 'https://github.com/ibm-ecm/wpxt-file-type-plugin',
        topic_repositoryId_href: '#configuration',
        topic_prefPath_href: '#configuration',
        
	}),
    
    fr: true
});
