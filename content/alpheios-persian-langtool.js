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
 * Persian-specific startup method in the derived instance which
 * loads the dictionary files. Called by the derived instance
 * keyed by the preference setting 'extensions.alpheios.persian.methods.startup'.
 * @returns true if successful, otherwise false
 * @type boolean
 */
Alph.LanguageTool_Persian.prototype.loadShortDefs = function()
{
    this.s_logger.info("Loading Short Defs");
    this.d_defsFile = Array();
    this.d_shortLexCode =
            Alph.BrowserUtils.getPref("dictionaries.short", this.d_sourceLanguage).split(',');

    for (var i = 0; i < this.d_shortLexCode.length; ++i)
    {
        // load the local short definitions dictionary data file
        try
        {
            this.d_defsFile[i] =
                new Alph.Datafile(
                        Alph.BrowserUtils.getContentUrl(this.d_sourceLanguage) + '/dictionaries/' +
                        this.d_shortLexCode[i] +
                        "/per-" +
                        this.d_shortLexCode[i] +
                        "-defs.dat",
                        "UTF-8");
            this.s_logger.info(
                "Loaded xxxx Persian defs for " +
                this.d_shortLexCode[i] +
                "[" +
                this.d_defsFile[i].getData().length +
                " bytes]");

        }
        catch (ex)
        {
            alert("error loading definitions: " + ex);
            return false;
        }
    }
    return true;
};

/**
 * Persian-specific implementation of {@link Alph.LanguageTool#postTransform}.
 * Looks up the lemma in the file of short meanings
 * @param {Node} a_node the node containing the lookup results
 */
Alph.LanguageTool_Persian.prototype.postTransform = function(a_node)
{
    var lang_obj = this;
    var defs = this.d_defsFile;
    var lex = this.d_shortLexCode;
    Alph.$(".alph-entry", a_node).each(
        function()
        {
            // get lemma
            var lemmaKey = Alph.$(".alph-dict", this).attr("lemma-key");
            var defReturn = Array(null, null);
            var i;

            // for each lexicon
            for (i = 0; i < lex.length; ++i)
            {
                // get data from defs file
                var defReturn =
                    Alph.LanguageTool_Persian.lookupLemma(lemmaKey,
                                                           null,
                                                           defs[i]);
                if (defReturn[1])
                    break;
            }

            // if we found definition
            if (defReturn[1])
            {

                // build meaning element
                var meanElt = '<div class="alph-mean">' +
                                defReturn[1] +
                              '</div>';

                // insert meaning into document
                lang_obj.s_logger.debug("adding " + meanElt);
                Alph.$(".alph-dict", this).after(meanElt);

                // build dictionary source element
                var srcElt = '<div class="alph-dict-source">' +
                    lang_obj.getString('dict.' + lex[i] + '.copyright') +
                    '</div>';
                Alph.$(".alph-dict", this).append(srcElt);

                // set lemma attributes
                lang_obj.s_logger.debug('adding @lemma-lang="per"');
                lang_obj.s_logger.debug('adding @lemma-key="' + defReturn[0] + '"');
                lang_obj.s_logger.debug('adding @lemma-lex="' + lex[i] + '"');
                Alph.$(".alph-dict", this).attr("lemma-lang", "per");
                Alph.$(".alph-dict", this).attr("lemma-key", defReturn[0]);
                Alph.$(".alph-dict", this).attr("lemma-lex", lex[i]);
            }
            else
            {
                lang_obj.s_logger.warn("meaning for " +
                              lemmaKey +
                              " not found [" + lex.join() + "]");
            }
        }
    );
    var copyright = this.getString('popup.credits');
    Alph.$('#alph-morph-credits',a_node).html(copyright);
}

/**
 * Persian-specific implementation of {@link Alph.LanguageTool#observePrefChange}.
 *
 * calls loadShortDefs and loadLexIds if the dictionary list changed
 * @param {String} a_name the name of the preference which changed
 * @param {Object} a_value the new value of the preference
 */
Alph.LanguageTool_Persian.prototype.observePrefChange = function(a_name,a_value)
{
    if (a_name.indexOf('dictionaries.short') != -1)
        this.loadShortDefs();

    if (a_name.indexOf('dictionaries.full') != -1)
    {
        this.loadLexIds();
        this.lexiconSetup();
    }
}

/**
 * Persian-specific implementation of {@link Alph.LanguageTool#getLemmaId}.
 *
 * @param {String} a_lemmaKey the lemma key
 * @returns {Array} (lemma id, lexicon code) or (null, null) if not found
 * @type Array
 */
Alph.LanguageTool_Persian.prototype.getLemmaId = function(a_lemmaKey)
{
    this.s_logger.info("in getLemmaId");
    // for each lexicon
    for (var i = 0; i < this.d_fullLexCode.length; ++i)
    {
        this.s_logger.warn("lookup " + a_lemmaKey );
        // get data from ids file
        var lemma_id =
            Alph.LanguageTool_Persian.lookupLemma(a_lemmaKey,
                                                a_lemmaKey,
                                                this.d_idsFile[i])[1];
        if (lemma_id) {
            return Array(lemma_id, this.d_fullLexCode[i]);
        }
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

    var key;
    var x = null;
    if (!a_key)
    {
        // if no key given, use the lemma
        key = a_lemma
    }
    else
    {
        // use supplied key
        key = a_key;
    }

    // count trailing digits
    var toRemove = 0;
    for (; toRemove <= key.length; ++toRemove)
    {
        // if not a digit, done
        var c = key.substr(key.length - (toRemove + 1), 1);
        if ((c < "0") || ("9" < c))
            break;
    }

    // try to find data
    var data = a_datafile.findData(key);
    if (!data && (toRemove > 0))
    {
        // if not found, remove trailing digits and retry
        key = key.substr(0, key.length - toRemove);
        data = a_datafile.findData(key);
  }

    // if data found
    if (data)
    {
        var sep = a_datafile.getSeparator();
        var specialFlag = a_datafile.getSpecialHandlingFlag();

        // find start and end of definition
        var startText = data.indexOf(sep, 0) + 1;
        var endText = data.indexOf('\n', startText);
        if (data.charAt(endText - 1) == '\r')
            endText--;

        // if special case
        if (((endText - startText) == 1) &&
            (data.charAt(startText) == specialFlag))
        {
            // retry using flag plus lemma without caps removed
            key = specialFlag + a_lemma;
            data = a_datafile.findData(key);
            if (!data)
            {
                // if not found, remove trailing digits and retry
                key = key.substr(0, key.length - toRemove);
                data = a_datafile.findData(key);
            }

            if (data)
            {
                startText = data.indexOf(sep, 0) + 1;
                endText = data.indexOf('\n', startText);
                if (data.charAt(endText - 1) == '\r')
                    endText--;
            }
        }
        // real data found
        if (data)
            return Array(key, data.substr(startText, endText - startText));
    }

    // nothing found
    return Array(key, null);
}

