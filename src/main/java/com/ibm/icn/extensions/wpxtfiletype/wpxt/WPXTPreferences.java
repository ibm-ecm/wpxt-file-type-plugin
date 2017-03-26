/**
 * Copyright 2017 IBM Corporation
 */
package com.ibm.icn.extensions.wpxtfiletype.wpxt;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.filenet.api.collection.ContentElementList;
import com.filenet.api.core.ContentTransfer;
import com.filenet.api.core.Document;
import com.filenet.api.core.Factory;
import com.filenet.api.core.ObjectStore;
import com.filenet.api.exception.EngineRuntimeException;
import com.ibm.ecm.extension.PluginLogger;

/**
 * 
 * Thus class is meant to extract information about the Workplace XT site preferences document.
 * 
 * @author Guillaume Delory
 * 
 * Feb 15, 2017
 * @copyright IBM 2017
 *
 */
public class WPXTPreferences {

    /**
     * Represent a WorkplaceXT FileType definition, with id (used in folder preferences for ET association),
     * name and mimetypes associated to this file type
     * 
     * @author G. Delory
     * @date Feb 10, 2015
     * @copyright IBM 2015
     *
     */
    static public class FileType{
        /**
         * The File Type's id, used in Entry Template association (annotation on folder)
         */
        public String id;
        /**
         * The name of the File Type
         */
        public String name;
        /**
         * All MIME Types used in this File Type
         */
        public List<String> mimetypes;
    }
    
    private ObjectStore os;
    private HashMap<String, FileType> fileTypes;
    private PluginLogger logger;
    
    /**
     * 
     * @param os {@link ObjectStore} the object store where to find the Work[place XT configuration files
     * @param logger {@link PluginLogger} the logger
     */
    public WPXTPreferences(ObjectStore os, PluginLogger logger) {
        this.os = os;
        this.logger = logger;
    }

    /**
     * @param id the file type's id
     * @return the File Type by Id
     */
    public FileType getFileType(String id) {
        return fileTypes.get(id);
    }
    
    public Collection<FileType> getFileTypes() {
        return fileTypes.values();
    }
    

    /**
     * Load the Workplace XT Seite preferences, if this method returns true, this object should not be used and using
     * it may cause exceptions or unexpected behaviors
     * @return true if the Workplace XT Site preferences can be find and loaded, false otherwise
     */
    public boolean loadPreferences(String preferencesPath) {
        Document preferences = null;
        try {
            preferences = Factory.Document.fetchInstance(os, preferencesPath, null);
        } catch (EngineRuntimeException e) {
            logger.logError(this, "loadPreferences", "'" + preferencesPath + "' can not be found on object store " + os.get_Name());
            logger.logError(this, "loadPreferences", e);
            return false;
        }
        
        try {
            XPathFactory xPathfactory = XPathFactory.newInstance();
            XPath xpath = xPathfactory.newXPath();
            ContentElementList contentElements = preferences.get_ContentElements();
            for (@SuppressWarnings("unchecked")
            Iterator<ContentTransfer> i = contentElements.iterator(); i.hasNext();) {
                ContentTransfer ct = i.next();
                InputStream is = ct.accessContentStream();
                
                DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
                DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
                org.w3c.dom.Document doc = dBuilder.parse(is);
                doc.getDocumentElement().normalize();
                
                loadFileTypes(doc, xpath);
                return true;
            }
        } catch (Exception e) {
            logger.logError(this, "loadPreferences", e.getMessage(), e);
            // Do nothing it will return false anyway
        } 
        return false;
    }


    private void loadFileTypes(org.w3c.dom.Document doc, XPath xpath) throws XPathExpressionException {
        XPathExpression expr = xpath.compile("//object[@key='fileType']");
        NodeList fileTypeNodes = (NodeList) expr.evaluate(doc, XPathConstants.NODESET);
        
        XPathExpression xPathId = xpath.compile("setting[@key='id']/text()");
        XPathExpression xPathName = xpath.compile("label[@key='label']/resource[not(@*)]/text()");
        XPathExpression xPathMimeTypes = xpath.compile("array[@key='mimeTypes']/value");
        fileTypes = new HashMap<String, FileType>();
        for (int j = 0; j < fileTypeNodes.getLength(); j++) {
            FileType ft = new FileType();
            Node fileTypeNode = fileTypeNodes.item(j);
            ft.id = (String) xPathId.evaluate(fileTypeNode, XPathConstants.STRING);
            ft.name = (String) xPathName.evaluate(fileTypeNode, XPathConstants.STRING);
            ft.mimetypes = new ArrayList<String>();
            NodeList mimeTypeNode = (NodeList) xPathMimeTypes.evaluate(fileTypeNode, XPathConstants.NODESET);
            for (int k = 0; k < mimeTypeNode.getLength(); k++) {
                ft.mimetypes.add(mimeTypeNode.item(k).getTextContent());
            }
            fileTypes.put(ft.id, ft);
        }
    }
    
}
