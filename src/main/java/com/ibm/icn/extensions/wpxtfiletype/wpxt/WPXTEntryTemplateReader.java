/**
 * Copyright 2017 IBM Corporation
 */
package com.ibm.icn.extensions.wpxtfiletype.wpxt;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 * This class is meant to extract information about Entry Template association for the Workplace XT.
 * It read the content of the folder preferences annotation containing the associations and make them usable.
 * 
 * @author Guillaume Delory
 * 
 * Feb 15, 2017
 * @copyright IBM 2017
 *
 */
public class WPXTEntryTemplateReader {

    private Document doc;
    
    private static final XPathFactory xPathfactory = XPathFactory.newInstance();
    private static final XPath xpath = xPathfactory.newXPath();
    private static XPathExpression xPathAssociations;
    private static XPathExpression xPathOsName;
    private static XPathExpression xPathVSId;
    private static XPathExpression xPathFileTypes;
    
    static {
        try {
            xPathAssociations = xpath.compile("/object[@key='folderPreference']/list[@key='folderTemplates']/object[@key='folderTemplate']");
            xPathOsName = xpath.compile("setting[@key='templateObjectStoreName']/text()");
            xPathVSId = xpath.compile("setting[@key='templateVersionSeriesId']/text()");
            xPathFileTypes = xpath.compile("array[@key='fileTypes']/value");
        } catch (XPathExpressionException e) {
            e.printStackTrace();
        }
        
    }
    
    public WPXTEntryTemplateReader(InputStream is) throws SAXException, IOException, ParserConfigurationException, XPathExpressionException {
        DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
        doc = dBuilder.parse(is);
        doc.getDocumentElement().normalize();
    }
    
    
    /**
     * Read the annotation document and returns the list of Entry Template association with all their information
     * @return {@link List} of {@link ETNode} containing all information about the association
     * @throws XPathExpressionException if the xml is not correctly formated
     */
    public List<ETNode> readETNodes() throws XPathExpressionException {
        ArrayList<ETNode> result = new ArrayList<ETNode>();
        String osName, vsId;
        Node list, fileType;
        NodeList fileTypes;
        ArrayList<String> fileTypesNames;
        NodeList nl = (NodeList) xPathAssociations.evaluate(doc, XPathConstants.NODESET);
        for (int i = 0; i < nl.getLength(); i++) {
            list = nl.item(i);
            osName = (String) xPathOsName.evaluate(list, XPathConstants.STRING);
            vsId = (String) xPathVSId.evaluate(list, XPathConstants.STRING);
            fileTypesNames = new ArrayList<String>();
            fileTypes = (NodeList) xPathFileTypes.evaluate(list, XPathConstants.NODESET);
            for (int j = 0; j < fileTypes.getLength(); j++) {
                fileType = fileTypes.item(j);
                fileTypesNames.add(fileType.getTextContent());
            }
            ETNode etNode = new ETNode();
            etNode.objectStoreName = osName;
            etNode.versionSeriesId = vsId;
            etNode.fileTypes = fileTypesNames;
            result.add(etNode);
        }
        return result;
    }

    /**
     * Represents one Entry Template association
     * 
     * @author G. Delory
     * @date Feb 10, 2015
     * @copyright IBM 2015
     *
     */
    public static class ETNode {
        /**
         * The object store's name
         */
        public String objectStoreName;
        /**
         * The Id of the version serie of the Entry Template used in this association
         */
        public String versionSeriesId;
        /**
         * The file types of the association, they are Workplace XT File types ID and
         * they don't mean anything without extracting these information from the Workplace XT
         * site preferences document, which contains the file types definition
         */
        public List<String> fileTypes;
    }
    
}
