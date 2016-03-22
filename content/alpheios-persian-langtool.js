/**
 * @fileoverview Persian extension of Alph.LanguageTool class
 * @version $Id: alpheios-persian-langtool.js 
 *
 * Copyright 2015 The Alpheios Project, Ltd.
 * http://alpheios.net
 *
 * This file is part of Alpheios.
 *
 * Alpheios is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alpheios is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

Components.utils.import("resource://alpheios-persian/alpheios-convert-persian.jsm",Alph);

Alph.LanguageToolFactory.addLang('persian','LanguageTool_Persian');

/**
 * @class  Persian implementation of {@link Alph.LanguageTool} 
 * @extends Alph.LanguageTool
 * @param {String} a_language  the source language for this instance
 * @param {Properties} a_properties additional properties to set as private members of
 *                                  the object (accessor methods will be dynamically created)
 */
Alph.LanguageTool_Persian = function(a_lang, props)
{
    Alph.LanguageTool.call(this,a_lang,{});
};

/**
 * @ignore
 */
Alph.LanguageTool_Persian.prototype = new Alph.LanguageTool();


/**
 * Overidde default lexicon lookup to use xhr directly
 * the old version of jQuery uses a header string for xml
 * content that looks like "application/xml, text/xml, star/star 
 * and newer service code (such as the flask restful implementation
 * used for the persian morphology service) just interprets that
 * as asking for JSON. We need to explicitly set that we're requesting
 * application/xml only to make sure we get what we want
 */
Alph.LanguageTool_Persian.prototype.setLexiconLookup = function()
{
    var lexicon_method =
        Alph.BrowserUtils.getPref("methods.lexicon",this.d_sourceLanguage);

    if (lexicon_method == 'webservice')
    {

        /**
         * @ignore
         */
        this.lexiconLookup = function(a_alphtarget,a_onsuccess,a_onerror)
        {   
            this.s_logger.info("Query for word: " + a_alphtarget.getWord()); 
            
            var url = Alph.BrowserUtils.getPref("url.lexicon",this.d_sourceLanguage);
            // override local daemon per main prefs
            if (Alph.Util.isLocalUrl(url) && Alph.BrowserUtils.getPref("morphservice.remote"))
            {
                   url = Alph.BrowserUtils.getPref("morphservice.remote.url");
             
            }
            url = url + Alph.BrowserUtils.getPref("url.lexicon.request",this.d_sourceLanguage);
            url = url.replace(/\<WORD\>/,
                                  encodeURIComponent(a_alphtarget.getWord()));
            // TODO add support for the context in the lexicon url

            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onerror = a_onerror;
            xhr.setRequestHeader("Accept", "application/xml")
            xhr.onreadystatechange = function() {
                if (xhr.status === 500 || xhr.status === 401 || xhr.status === 403 || xhr.status === 404 || xhr.status === 400) {
                    a_onerror(xhr.status, xhr.statusText);
                } else if (xhr.readyState === 4) {
                    // the basic libraries used html as the contentType, and they expect back plain text
                    a_onsuccess(xhr.responseText, xhr.status)
                }
                      
            };
            xhr.send();

        };
    }
}


/**
 * Persian-specific implementation of {@link Alph.LanguageTool#postTransform}.
 * @param {Node} a_node the node containing the lookup results
 */
Alph.LanguageTool_Persian.prototype.postTransform = function(a_node)
{
    var copyright = this.getString('popup.credits');
    Alph.$('#alph-morph-credits',a_node).html(copyright);
    var morphflags = Alph.$('.alph-morphflags',a_node);
    if (morphflags.length > 0 && 
        Alph.BrowserUtils.getPref('showmorphflags',this.d_sourceLanguage)) 
    {
	morphflags.each(
            function() {
                var ctx = Alph.$(this).attr('context');
                Alph.$(this).html(ctx);
            }
        );
    }
}

/**
 * Persian-specific implementation of {@link Alph.LanguageTool#observePrefChange}
 *
 * calls loadLexIds if the default full dictionary changed
 * @param {String} a_name the name of the preference which changed
 * @param {Object} a_value the new value of the preference
 */
Alph.LanguageTool_Persian.prototype.observePrefChange = function(a_name,a_value)
{
    if (a_name.indexOf('dictionaries.full') != -1)
    {
        this.loadLexIds();
        this.lexiconSetup();
    }
}

/**
 * loads the Persian-specific converter object
 * @see Alph.LanguageTool#loadConverter
 */
Alph.LanguageTool_Persian.prototype.loadConverter = function()
{
    this.d_converter = new Alph.ConvertPersian();  
};

/**
 * Persian-specific implementation of {@link Alph.LanguageTool#getLemmaId}.
 *
 * @param {String} a_lemmaKey the lemma key
 * @returns {Array} (lemma id, lexicon code) or (null, null) if not found
 * @type Array
 */
Alph.LanguageTool_Persian.prototype.getLemmaId = function(a_lemmaKey)
{
    // for each lexicon
    for (var i = 0; i < this.d_fullLexCode.length; ++i)
    {
        // get data from ids file
        var lemma_id =
            Alph.LanguageTool_Persian.lookupLemma(a_lemmaKey,
                                                 null,
                                                 this.d_idsFile[i])[1];
        if (lemma_id)
            return Array(lemma_id, this.d_fullLexCode[i]);
    }

    this.s_logger.warn("id for " +
                  a_lemmaKey +
                  " not found [" +
                  this.d_fullLexCode.join() + ']');

    return Array(null, null);
}

/**
 * Lookup lemma
 *
 * @param {String} a_lemma original lemma
 * @param {String} a_key key to look up or null
 * @param {Alph.Datafile} a_datafile datafile to search with key
 * @returns {Array} (key, data)
 * @type String
 */
Alph.LanguageTool_Persian.lookupLemma =
function(a_lemma, a_key, a_datafile)
{
    if (!a_datafile)
        return Array(null, null);

    // try key or lemma first
    var lemma = a_lemma;
    var key = (a_key ? a_key : lemma);
    var data = a_datafile.findData(key);
    var x = null;

    // if data found
    if (data)
    {
        var ids = "";
        var startPos = 0;

        // while more data to look at
        while (startPos < data.length)
        {
            // find start and end of definition
            var startText = data.indexOf(a_datafile.getSeparator(),
                                         startPos) + 1;
            var endText = data.indexOf('\n', startText);
            startPos = endText + 1;
            if (data.charAt(endText - 1) == '\r')
                endText--;

            // add to list of ids
            if (ids.length > 0)
                ids += ",";
            ids += data.substr(startText, endText - startText);
        }

        // real data found
        return Array(key, ids);
    }

    // nothing found
    return Array(lemma, null);
}

