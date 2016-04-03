# Alpheios Persian Language Tools

The Alpheios Persian Language Tools are being developed jointly by the Alpheios Project, Ltd., the Roshan Institute for Persian Studies at the University of Maryland, and the Perseids Project at the Perseus Digital Library at Tufts University.

## Status as of 2-April 2016

### Installing 

An unsigned development build of the plugin can be found in the dist directory of this repository (the alpheios-persian.xpi). 

Before installing this build in Firefox you must set the ` xpinstall.signatures.required` setting for Firefox to `false`.   See https://www.reddit.com/r/firefox/comments/3xgykb/how_do_i_reenable_unsigned_addons/ for instructions.

Then you can install by simply opening the xpi file in Firefox (File/Open).  You will need to click "Install" on the dialog that comes up.

After installing, restart Firefox in order to fully activate the plugin.

It requires an active internet connection to function as currently configured, although all of the dependencies could be installed locally with some work. The key components are described below.

## Key components 

* the Morphology Service is implemented as a wrapper over the HAZM Morphological Analyzer that implements both the older Alpheios Morphology API and the newer Tufts Morphology Service API.  It is deployed on a Perseids-provided server currently and the Alpheios interface is available at http://services.perseids.org/pysvc/alpheiosservice/hazm?word=<word>. The source code is available at https://github.com/PersDigUMD/MorphologyServiceAPI.

* The short and full definitions come from the "Comprehensive Persian-English Dictionary" (Francis Joseph Steingass). The full dictionary is deployed on an Alpheios server and available via the Alpheios Lexicon service at http://repos1.alpheios.net/exist/rest/db/xq/lexi-get.xq?lx=stg&lg=per&out=html[&l=<lemma>|&n=<lemmid>]. 
    * The source data files for the dictionary can be found on the Alpheios sourceforge repo at https://sourceforge.net/p/alpheios/code/HEAD/tree/dictionaries/per/stg/trunk/src/. 
    * The Alpheios Lexicon service is an eXist-based XQuery service.  The sourcecode for this service can be found in https://sourceforge.net/p/alpheios/code/HEAD/tree/xml_ctl_files/ . General instructions for creating and loading dictionary files for this service can be found in https://sourceforge.net/p/alpheios/code/HEAD/tree/dictionaries/trunk and the `build.xml` file there describes how to load the source code and data into eXist.

* The plugin source code itself can be found in this repository.




