# Alpheios Persian Language Tools

The Alpheios Persian Language Tools are being developed jointly by the Alpheios Project, Ltd., the Roshan Institute for Persian Studies at the University of Maryland, and the Perseids Project at the Perseus Digital Library at Tufts University.

## Installing 

An unsigned development build of the plugin can be found in the `dist` directory of this repository (the [alpheios-persian-latest.xpi](https://github.com/alpheios-project/persian/raw/master/dist/alpheios-persian-latest.xpi).

* Install Prerequisites

    * Firefox 44. (The plugin may not work properly with any version of Firefox later than 44. Firefox 45.0.1 has been reported to be successful, but see [http://alpheios.net/content/letter-alpheios-users] for more information on the future of the current Alpheios code base and Firefox.)

    * You must have the Alpheios Basic Libraries installed. See http://alpheios.net/content/installation for more instructions on installing Alpheios. 

    * As this is an unsigned, development build, you must set the ` xpinstall.signatures.required` setting for Firefox to `false` in order to install it.   See https://www.reddit.com/r/firefox/comments/3xgykb/how_do_i_reenable_unsigned_addons/ for instructions.

* Install Plugin

    * Install by simply opening the xpi file in Firefox (File/Open).  You will need to click "Install" on the dialog that comes up.

    * After installing, restart Firefox in order to fully activate the plugin.

The plugin requires an active internet connection to function as currently configured, although all of the dependencies could be installed locally with some work. The key components are described below.

## Key components 

* the Morphology Service is implemented as a wrapper over the HAZM Morphological Analyzer that implements both the older Alpheios Morphology API and the newer Tufts Morphology Service API.  It is deployed on a Perseids-provided server currently and the Alpheios interface is available at http://services.perseids.org/pysvc/alpheiosservice/hazm?word=<word>. The source code is available at https://github.com/PersDigUMD/MorphologyServiceAPI.

* The short and full definitions come from the "Comprehensive Persian-English Dictionary" (Francis Joseph Steingass). The full dictionary is deployed on an Alpheios server and available via the Alpheios Lexi-Get service at http://repos1.alpheios.net/exist/rest/db/xq/lexi-get.xq?lx=stg&lg=per&out=html[&l=<lemma>|&n=<lemmid>]. 
    * The source data files for the dictionary can be found on the Alpheios sourceforge repo at https://sourceforge.net/p/alpheios/code/HEAD/tree/dictionaries/per/stg/trunk/src/. 
    * The Alpheios Lexi-Get service is an eXist-based XQuery service.  The sourcecode for this service can be found in https://sourceforge.net/p/alpheios/code/HEAD/tree/xml_ctl_files/ . General instructions for creating and loading dictionary files for this service can be found in https://sourceforge.net/p/alpheios/code/HEAD/tree/dictionaries/trunk and the `build.xml` file there describes how to load the source code and data into eXist.

* The Persian plugin source code itself can be found in this repository.  

* The Alpheios Basic Libraries source code can be found at https://sourceforge.net/p/alpheios/code/HEAD/tree/basic-reader/ . Other language extensions, which can be helpful for reference, can be found at https://sourceforge.net/p/alpheios/code/HEAD/tree/language-extensions/.  For more information on the Alpheios code, see http://alpheios.net/content/alpheios-firefox-plugins . For a general user-guide to Alpheios, see http://alpheios.net/content/user-guide.

## Current Status (as of 2-April-2016)

The plugin works successfully for some words and lemmas, but all of the components need additional work.  The basic sequence of steps are involved in a word lookup.

1. User double-clicks on word to lookup (or enters it in the lookup box on the Alpheios toolbar). 
2. Plugin calls the Morphology Service sending it the word 
3. Morphology service returns the lemma and part of speech.
4. Plugin searches for the lemma in the `per-stg-defs.dat` file
5. If the short definition is found, it is displayed along with the part-of-speech and lemma in the Alpheios popup.
6. User clicks on the Define icon in the Alpheios popup.
7. Plugin searches for the lemma in the `per-stg-ids.dat` file. If an id is found for the lemma, it uses that to retrieve the full definition from the Alpheios Lexi-Get service. If an id is not found for the lemma, is uses the lemma itself to retrieve the full definition from the Alpheios Lexi-Get service.

Assuming all services are deployed and accessible, the key places where things can go wrong are as follows:

1. No Lemma: The Morphology Service fails to return a lemma for the word, or it returns the wrong lemma
2. No Short Definition: The search for the lemma in the `per-stg-defs.dat` file fails
3. No Full Definition: The search for the lemma in the `per-stg-ids.dat` returns the wrong id, or the search for the lemma id or the Lexi-Get service fails to find either the id or the lemma in the full TEI file.

In our initial tests, we have experienced all three problems.

1. As was previously reported with its deployment in Arethusa, the Morphology Service interface to HAZM is probably not always returning the correct lemmas.
2. The plugin code is not always finding the lemmas in the defs and ids files, even though they are there. There are two key candidates for the source of this problem:
    1 .the binary search algorithm used by the Alpheios Basic Libraries to search in the data file is failing due to discrepancies in the way JavaScript thinks the files should be sorted, and the way they are actually sorted.  See https://datatables.net/plug-ins/sorting/persian for some possible pointers to this problem. Fixing this may require overriding the datafile lookup functionality which comes from the Alpheios Basic Libraries in the Persian plugin code. (i.e. overriding the code here https://sourceforge.net/p/alpheios/code/HEAD/tree/basic-reader/trunk/modules/alpheios-datafile.jsm  in here https://github.com/alpheios-project/persian/blob/master/content/alpheios-persian-langtool.js )
    2. It will probably also be necessary to normalize the Persian unicode characters that are sent to the various services so that they are all using the same  precombined versus composed variations, etc.  See the Greek and Arabic Alpheios language extensions for how this can be done. It will require a good understanding of what unicode chars are and aren't both acceptable and used commonly for Persian. It's quite possible there are good javascript libraries for dealing with this already and they just need to be applied.

## Developing/Debugging Tips

1. Turn on DEBUG level logging to see the results of all service calls and what the plugin is trying to do with them. It will produce noise in the browser console but it's probably impossible to debug without this.  To turn on DEBUG logging, select Help, Options on the Alpheios Toolbar,  click Advanced and then select "All" for Console Log Level. When you use the plugin then, you can see all of the detail in the Browser Console, which can be accessed by Tools, Web Developer, Browser Console. Note that this is NOT the same thing as Web Console. The latter doesn't show plugin activity.

2. In order to rebuild the Persian language tools xpi, you must have Java, Ant, Svnant 1.0.0 and the Ant-Contrib library 1.0b3 installed.  The build.xml in the root of this repo has properties that may need to be updated to point at the proper places for svnant and ant-contrib.  The minimum targets you need to run in order to create a development build are:
    1. `ant get-extras` will retrieve the dictionary files from sourceforge and put them in the correct location for the plugin
    2. `ant build` will build a development copy of the xpi

3. Building a production version of the xpi, i.e. that could be submitted to Mozilla for signing and release, will require additional development work in the build.xml because it is coded for interaction with svn and not git, for tasks related to setting the version of the build, etc. It may not be worthwhile investing this effort at this time, due to the issues with Firefox 45+ and Alpheios.

 





