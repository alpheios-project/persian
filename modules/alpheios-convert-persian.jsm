/**
 * @fileoverview Persian specific string conversion methods 
 * Exports a single symbol, ConvertPersian which must be imported into the namespace 
 * of the importing class.
 *
 * @version $Id:
 *   
 * Copyright 2010 Cantus Foundation
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
 
const EXPORTED_SYMBOLS = ['ConvertPersian'];
Components.utils.import("resource://alpheios/alpheios-browser-utils.jsm");
Components.utils.import("resource://alpheios/alpheios-convert.jsm");

/**
 * @class Persian string conversion class
 * @extends Convert
 */
ConvertPersian = function()
{
    Convert.call(this);
}

ConvertPersian.prototype = new Convert();

/**
 * persian ascii transliteration (unicode to Buckwalter)
 * @param {String} a_str the string to convert
 * @returns the converted string
 * @type {String}
 */
ConvertPersian.prototype.unicodeToBuckwalter = function(a_str)
{
    // module code doesn't have access to the browser window object under the global 
    // scope .. need to get a recent window to have access to browser window methods
    var recent_win = BrowserUtils.getMostRecentWindow();

    /* initialize the XSLT converter if we haven't done so already */
    if (this.u2bConverter == null)
    {
        this.d_u2bConverter = BrowserUtils.getXsltProcessor('alpheios-uni2buck.xsl');
    }
    var buckText = '';
    try
    {
        this.d_u2bConverter.setParameter(null, "e_in", a_str);
        var dummy = (new recent_win.DOMParser()).parseFromString("<root/>","text/xml");
        buckText = this.d_u2bConverter.transformToDocument(dummy).documentElement.textContent;
    }
    catch (e)
    {
        this.s_logger.error(e);
    }
    return buckText;
}
