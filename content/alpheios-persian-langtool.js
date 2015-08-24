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
 * Persian-specific startup method in the derived instance which
 * xslt for stripping the unicode. Called by the derived instance
 * keyed by the preference setting 'extensions.alpheios.greek.methods.startup'.
 * @returns true if successful, otherwise false
 * @type boolean
 */
Alph.LanguageTool_Persian.prototype.loadStripper = function()
{
    try
    {
        this.d_stripper =
            Alph.BrowserUtils.getXsltProcessor('alpheios-ara-unistrip.xsl');
        this.d_stripperList =
            Alph.BrowserUtils.getPref('stripper.list',this.d_sourceLanguage).split(',');
    }
    catch (ex)
    {
        alert("error loading xslt alpheios-ara-unistrip.xsl: " + ex);
        return false;
    }

    return true;
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
                                                 this.d_idsFile[i],
                                                 this.d_stripper,
                                                 this.d_stripperList)[1];
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
 * @param a_stripper transform to remove diacritics, etc.
 * @param a_stripperList list of preferred transforms
 * @returns {Array} (key, data)
 * @type String
 */
Alph.LanguageTool_Persian.lookupLemma =
function(a_lemma, a_key, a_datafile, a_stripper, a_stripperList)
{
    if (!a_datafile)
        return Array(null, null);

    // try key or lemma first
    // strip trailing underscore and digits from lemma
    var lemma = a_lemma.replace(/[_\u0640][0-9]+$/,"");
    var key = (a_key ? a_key : lemma);
    var data = a_datafile.findData(key);
    var x = null;
    var stripperList = a_stripperList;
    //var stripperList = ["tanwin", "hamza", "harakat", "shadda", "sukun", "alef"];

    // if not found, try various drops
    if (!data)
    {
        for (i in stripperList)
        {
            a_stripper.setParameter(null, "e_in", key);
            a_stripper.setParameter(null, "e_toDrop", stripperList[i]);
            if (!x)
                x = (new DOMParser()).parseFromString("<dummy/>", "text/xml");
            var key2 = a_stripper.transformToDocument(x)
                                 .documentElement.textContent;            
                                             
            // if not a new key, don't bother trying to find it
            if (key2 == key)
                continue;
            
            // if found, stop looking
            key = key2;
            data = a_datafile.findData(key);
            if (data)
                break;
        }
    }

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

