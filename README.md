# WPXT File Type Plug-in

In a nutshell, this plug-in lets you use Workplace XT File Type Categories in ICN.

To be more accurate, this plug-in allows the use of Workplace XT Entry Templates, associated with folders under Workplace XT using WPXT File Type Categories. I know this is a bit confusing, but read the [**Who should use this plug-in**](https://github.com/ibm-ecm/wpxt-file-type-plugin#who-should-use-this-plug-in) section to get more information and know if you need it.

## Getting started
### Prerequisites
* IBM Content Navigator 2.0.3.0 or later

### Installing the plug-in
This plug-in is a little bit different from other plug-ins, because it needs to have access to the repositories to fetch the Workplace XT preferences document. That means you have to install and configure the plug-in from another desktop than the *admin* desktop. So you should connect as an admin to any other desktop and access the admin feature using the icon of the *Administration View* feature on the left of the screen.

1. Copy the [plug-in's jar](https://github.com/ibm-ecm/wpxt-file-type-plugin/releases) in a location accessible by your ICN instance, or by all instances if you're using a clustered environment, or replicate it to all instances in the same location.
2. Access the admin feature in a normal desktop (do not use the admin desktop as mentioned above) > _Plug-Ins_ and click _New Plug-In_.
3. Enter the full path of the plug-in's jar and click Load.
4. Set up the initial configuration to fit best your needs. See the [configuration](https://github.com/ibm-ecm/wpxt-file-type-plugin#configuration) section for more details on all options.

### Add the action/feature
This plug-in does not have any action or feature. It is loaded by all clients (browsers) when connecting to ICN so no extra configuration outside of the plug-in's configuration panel is required.
 
### Configuration
As mentioned above, make sure you are not under the admin desktop when configuring this plug-in, but instead in another desktop accessing the admin feature by clicking on the icon on the left of the screen.

| Option        | Description | 
| - |:-:|
| Workplace XT Repository | Select the FileNet P8 repository (i.e. object store) hosting the Workplace XT preferences file. The plug-in needs to be able to access this file to read the File Type Categories. |
| Workplace XT Preferences document | That's the absolute path of the Workplace XT preferences file in the object store named above. Usually this path is by default */Preferences/Site Preferences for WorkplaceXT*, but it can be changed when you configure the bootstrap preferences in Workplace XT. |
| Mapping | This section is loaded automatically as soon as the plug-in is able to read your Workplace XT preferences file, and will offer you to map each Workplace XT File Type Category with an ICN File Type filter. It will also try to map them automatically if names match. You can look at the picture below to see what the mapping section looks like. The first time you install this plug-in you might have to save twice the configuration, or even sometime to save and close or refresh ICN to get this section displayed, because the plug-in might require to be fully installed to be able to access the repository. |

![mapping-section](https://raw.githubusercontent.com/ibm-ecm/wpxt-file-type-plugin/master/readme/mapping-section.jpg "Mapping section")

### How to check mapping is being correctly used

When you configured your mapping in the plug-in's configuration, you should make sure it has correctly been saved and is being used when user are loading ICN. To check, simply load ICN with debug log enable:
```http(s)://hostname:port/navigator?logLevel=4```
And search the debug pop-up for **ecm.LoggerMixin.WpxtFileTypePlugin**. If everything works properly, you should see 2 lines with JSON object representing your mapping:

![debug-log](https://raw.githubusercontent.com/ibm-ecm/wpxt-file-type-plugin/master/readme/debug-log.jpg "Debug Log")

## Who should use this plug-in
Please note that this plug-in is *not* for every one. It is about a really specific use-case when migrating from Workplace XT to ICN. If you are not in this specific use-case, you do **NOT** need to install this plug-in.

### When should you use it

This plug-ins fills a specific gap in ICN: The File Type Categories restrictions on Entry Template associations. That means, if at the time you were using Workplace XT, you:
- Created Entry Templates
- Created Custom File Type Categories gathering some MIME Types
- Associated one or more Entry Template on some folders
- Used your File Type Categories to restrict the associations

This is how it looks:

![wpxt-association](https://raw.githubusercontent.com/ibm-ecm/wpxt-file-type-plugin/master/readme/WPXT-association.jpg "Associations in Workplace XT")

You will see that your Entry Template won't be used in ICN, or more precisely only the one with no restriction on file types will be used. And this is what it looks like in ICN

![icn-fail-resolving-et](https://raw.githubusercontent.com/ibm-ecm/wpxt-file-type-plugin/master/readme/icn-fail-resolving-et.jpg "ICN fails to find your ET")

If you only have a few associations, you can re-create them on the same folder under ICN, using the WPXT Entry templates but ICN File Types instead of WPXT File Type Categories. That will work perfectly fine since ICN associations prevail on WPXT ones, but that't not always on option if you have hundreds of associations. That's when this plug-in comes handy.

### Who should **not** use it

If you are in any of the following categories, you do not need this plug-in, period.

- You have no idea what Workplace XT is :)
- You are not migrating your Object Store from Workplace XT but using a new one
- You are migrating from Workplace XT but were not using Entry Templates (or you do not know what Entry Templates are)
- You are migrating from Workplace XT, were using Entry Templates, but never use File Type Categories to restrict the association (*Options...* button when associations) 

If you are still reading at this point, you should probably go read the [**Who should you use it section**](https://github.com/ibm-ecm/wpxt-file-type-plugin#when-should-you-use-it).

## Demonstration

Here is a video describing the migration from Workplace XT to ICN issue more in depth, then how to resolve it by installing and using the plug-in.

[![basic-behavior](http://img.youtube.com/vi/tiMth1KxONc/0.jpg)](https://youtu.be/tiMth1KxONc)

## Issues

If you find any issue in the plug-in, please open an Issue in this GitHub repository, we'll be happy to take a look at it as soon as we can. Please remember that this is an Open Source project without official support so we can't commit to any deadline.
Feel free to submit a Pull Request yourself if you already fixed it, we'll be happy to accept it to share it with everyone else.

## Enhancements

You can also open enhancement requests, but as mentioned in the Issue section, this is an open source plug-in without official support so we can't commit to any deadline of any promises on implementing the requests.

## If you want to know more

If you want to dig deeper and understand why it's not working, you can read this section, I also explained more in details [here](http://www.notonlyanecmplace.com/workplace-xt-file-type-issue-in-icn/).

Basically, the Workplace XT associations are kept as xml annotation on folders. This is how they look:
```xml
<object key="folderPreference" version="1.0">
    <list key="folderTemplates">
        <object key="folderTemplate">
            <setting key="templateObjectStoreName">TARGETOS</setting>
            <setting key="templateVersionSeriesId">{E9986DA5-1082-4B73-B7A3-C9B996962F4E}</setting>
            <array key="fileTypes">
                <value>i0dwzm4z</value>
            </array>
        </object>
        <object key="folderTemplate">
            <setting key="templateObjectStoreName">TARGETOS</setting>
            <setting key="templateVersionSeriesId">{5E26863D-5E46-40E4-AC3A-698192FBD473}</setting>
            <array key="fileTypes"/>
        </object>
    </list>
</object>
```

You can see here I have two associations, one restricted to one file type and the other without any restriction. I guess at this point you already figured out the issue, File Type Categories are stored in the xml as IDs...

Although ICN has been implemented to be compatible with Workplace XT as much as it could, and does understand the xml annotations from Workplace XT, it has no way to resolve the IDs to actual MIME Types since it does not even know where the Workplace XT preferences file is. Thats means these IDs do not make any sense to ICN and it will never use the restricted Entry Templates.


## What does this plug-in really do

If you are interested  with how the plug-in fixes this you can read this section. You can also read [this](http://www.notonlyanecmplace.com/workplace-xt-file-type-issue-in-icn/) where I'm explaining a bit better what is going on and how we fixed that.

The way it works is pretty simple. When the user loads ICN and connects to a desktop where the plug-in is enabled, it will fetch the mapping from the plug-in's configuration, and do an *aspect.after* on *_retrieveEntryTemplatesCompleted* method of the repository to patch the ID with the matching ICN File Types. That way, any future uses of the association by ICN will be correct since it will be able to use its own File Types restrictions.

## Contributors

### License

This plug-in is released under the [Apache 2](http://www.apache.org/licenses/LICENSE-2.0) license.

### How to configure

This plug-in is using Gradle as build automation system. Import, download, fork the project. Then you have two options to provide the three jars that are not part of the open-source release:

#### Copy them in the lib folder

Create a ***lib*** folder in the project's folder, copy *j2ee.jar*, *jace.jar* and *navigator.jar* (renamed from *navigatorAPI.jar*) in it and you are done. These jars can be found on any machine with ICN/FileNet installed under **/opt/IBM/ECMClient/lib** for *navigatorAPI.jar*, **/opt/IBM/FileNet/ContentEngine/lib** for Jace.jar and **/opt/IBM/WebSphere/AppServer/lib** for *j2ee.jar* (if you're using WebSphere).

#### Use your own private Maven repository if you have one
If you own your own Maven repository where the three needed jars are deployed, just comment the tree following lines in build.gradle:
```
compile name: 'jace'
compile name: 'j2ee'
compile name: 'navigator'
```

And uncomment the three following lines. Edit them if you are using different groupIds, artifactIds or versions.

```
// compile 'com.ibm.filenet:jace:5.2.1'
// compile 'com.ibm.javax:j2ee:1.4.1'
// compile 'com.ibm.icn:navigatorAPI-plugin:2.0.3'
```

### How to compile

Simply run 
```
gradle assemble
```
in the project and you will get the final jar in ***build/dist*** folder.

### How to directly use classes in ICN
If you're working on the plug-in, it is easier to use the classes directly in ICN instead of building and deploying the jar every time. Since the Gradle conventions dictate to split sources and resources, the default approach doesn't work. To work around that, we've changed the ***classes*** task of Gradle to compile and gather everything in a single folder under ***build/all***. So all you have to do is configure ICN as follow:
* Class file path: *$project_path*/build/all
* Class name: com.ibm.icn.extensions.wpxtfiletype.WpxtFileTypePlugin

Then run ```gradle classes``` every time you want to push changes to your ICN instance. Of course you will still have to click the Load button if you changed the Java files, and refresh the page if you change the JavaScript files as you would normally do.

### Contribute

If you wish to contribute to this plug-in, the simplest way is to create Pull Requests and we will integrate them whenever it makes sense. If you want to become a long term contributor and have contributor access to the plug-in, you will have to contact us, and fill a Contributor License Agreement.