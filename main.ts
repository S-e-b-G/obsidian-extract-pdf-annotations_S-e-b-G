// npm install obsidian
// npm install color-convert


//import { App, Editor, MarkdownView, TFile, Vault, Plugin, PluginSettingTab, Setting, loadPdfJs } from 'obsidian';
import { App, Editor, MarkdownView, TFile, Vault, Plugin, loadPdfJs } from 'obsidian';
import convert from 'color-convert';    // For color conversion

// Local modules
import { loadPDFFile } from 'extractHighlight';
import { saveDataToFile } from './saveToFile';
import { PDFAnnotationPluginSetting } from './PDFAnnotationPluginSetting'
import { PDFAnnotationPluginSettingTab } from './PDFAnnotationPluginSetting'


// Formatting
const title_lvl1 = "##### ";
const lvl2_prefix = "- ";
const lvl3_prefix = "	- ";

var highlighted = template`${"highlightedText"}`;
var note = template`${'body'}`;



function template(strings, ...keys) {
    return (function(...values) {
        const dict = values[values.length - 1] || {};
        const result = [strings[0]];
        keys.forEach(function(key, i) {
            const value = Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        });
        return result.join('');
    });
}



function getColorName(i_RGB: number[])
{
    let l_HSL = convert.rgb.hsl(i_RGB);
    let l_hue = l_HSL[0];
    let l_return = "";

    if( (l_hue  <= 20) )
    { l_return = "Red"; }
    else if (   (l_hue >   20)  &&
                (l_hue <=  55)  )
    { l_return = "Orange"; }
    else if (   (l_hue >   55)  &&
                (l_hue <=  70)  )
    { l_return = "Yellow"; }
    else if (   (l_hue >   70)   &&
                (l_hue <= 160)   )
    { l_return = "Green"; }
    else if (   (l_hue >  160)   &&
                (l_hue <= 195)   )
    { l_return = "Cyan"; }
    else if (   (l_hue >  195)   &&
                (l_hue <= 240)   )
    { l_return = "Blue"; }
    else if (   (l_hue >  240)   &&
                (l_hue <= 270)   )
    { l_return = "Indigo"; }
    else if (   (l_hue >  270)   &&
                (l_hue <= 300)   )
    { l_return = "Violet"; }
    else if (   (l_hue >  300)   &&
                (l_hue <= 330)   )
    { l_return = "Magenta"; }
    else
    { l_return = "Red"; }

    return l_return;
}



export default class PDFAnnotationPlugin extends Plugin {

    public settings: PDFAnnotationPluginSetting;

    sort(grandtotal) {
        const settings = this.settings


        if (settings.sortByTopic) {
            grandtotal.forEach((anno) => {
                const lines = anno.body.split(/\r\n|\n\r|\n|\r/); // split by:     \r\n  \n\r  \n  or  \r
                anno.topic = lines[0]; // First line of contents
                anno.body = lines.slice(1).join('\r\n')
            })
        }


        grandtotal.sort(function(a1, a2) {
            if (settings.sortByTopic) {
                // sort by topic
                if (a1.topic > a2.topic) return 1
                if (a1.topic < a2.topic) return -1
            }

            if (settings.useFolderNames) {
                // then sort by folder  
                if (a1.folder > a2.folder) return 1
                if (a1.folder < a2.folder) return -1
            }

            // then sort by file.name  
            if (a1.file.name > a2.file.name) return 1
            if (a1.file.name < a2.file.name) return -1

            // then sort by page
            if (a1.pageNumber > a2.pageNumber) return 1
            if (a1.pageNumber < a2.pageNumber) return -1

            // they are on the same, page, sort (descending) by minY
            // if quadPoints are undefined, use minY from the rect-angle
            if (a1.rect[1] > a2.rect[1]) return -1
            if (a1.rect[1] < a2.rect[1]) return 1
            return 0
        })
    }


    format(grandtotal, i_isForMindmap: boolean, i_isGetNrml: boolean, i_isGetLow: boolean) {
        // Args:
        // grandtotal:     list of annotations
        // i_isForMindmap: true if extraction for mindmap
        // i_isGetNrml:    true if extraction of normal priority infos (yellow)
        // i_isGetLow:     true if extraction of low    priority infos (light blue)
        // now iterate over the annotations printing topics, then folder, then comments...
        let text            = ''
        if (i_isForMindmap == false) { var text_dt = ''; }
        let text_cd         = '';
        //let text_3 = '';
        let topic           = '';
        let currentFileName = '';
        let currentFolderName = "";
        //let currentFullPath = "";
        let l_pageNumber    = 0;
        let l_previousLevel = "";
        let l_isPrevBullet  = false;
        let color_lvl1      = convert.rgb.hsl(this.settings.level1RGB);
        let color_lvl2      = convert.rgb.hsl(this.settings.level2RGB);
        let color_lvl3      = convert.rgb.hsl(this.settings.level3RGB);
        let color_sumr      = convert.rgb.hsl(this.settings.summryRGB);
        let color_impt      = convert.rgb.hsl(this.settings.imprttRGB);
        let color_lvl1Hue   = color_lvl1[0];
        let color_lvl2Hue   = color_lvl2[0];
        let color_lvl3Hue   = color_lvl3[0];
        let color_sumrHue   = color_sumr[0];
        let color_imptHue   = color_impt[0];
        let color_lvl1Lum   = color_lvl1[2];
        let color_lvl2Lum   = color_lvl2[2];
        let color_lvl3Lum   = color_lvl3[2];
        let color_sumrLum   = color_sumr[2];
        let color_imptLum   = color_impt[2];
        let color_maxHue    = 360;
        let color_maxLum    = 100;
        let lvl1_format     = this.settings.lvl1_format;
        let lvl2_format     = this.settings.lvl2_format;
        let lvl3_format     = this.settings.lvl3_format;
        let sumr_format     = this.settings.sumr_format;
        let impt_format     = this.settings.impt_format;
        let note_format     = this.settings.note_format;
        let note_preamb     = this.settings.note_preamb+" ";
        let lvl1_icon       = this.settings.lvl1_icon+" ";
        let lvl2_icon       = this.settings.lvl2_icon+" ";
        let lvl3_icon       = this.settings.lvl3_icon+" ";
        let sumr_icon       = this.settings.sumr_icon+" ";
        let impt_icon       = this.settings.impt_icon+" ";
        let unkn_icon       = this.settings.unkn_icon+" ";


        if (i_isForMindmap) {// Mindmap format
            text = `---

mindmap-plugin: basic

---
`;
        }
        else {// Not Mindmap format
            // Get date and time:
            const l_date = new Date();
            const l_day = String(l_date.getDate()).padStart(2, '0');
            const l_month = String(l_date.getMonth() + 1).padStart(2, '0');
            const l_year = String(l_date.getFullYear());
            const l_hours = String(l_date.getHours()).padStart(2, '0');
            const l_minutes = String(l_date.getMinutes()).padStart(2, '0');
            const l_dateTime = `${l_day}/${l_month}/${l_year} @${l_hours}:${l_minutes}`

            // Set beginning of file
            text = this.settings.begin_prb.replace('{dateTime}', l_dateTime);
        }


        grandtotal.forEach((a) => {
            // print main Title when Topic changes (and settings allow)
            if (this.settings.sortByTopic) {
                if (topic != a.topic) {
                    topic = a.topic
                    currentFileName = ''
                    //text += `# ${topic}\n`
                    text += `
# ${topic}
`;
                }
            }

            if (this.settings.useFolderNames) {
                if (currentFileName != a.folder) {
                    currentFileName = a.file.name;
                    currentFolderName = a.folder;
                    if (i_isForMindmap == false) {
                        text += this.settings.pdf_f_prb.replace("{fileName}",currentFileName);

                    }
                    else {
                        text += "### [[" + currentFileName + "]]\n";
                        if(this.settings.mm_preamb)
                        { text += "#### _\n"; }
                    }
                }
            } else {
                if (currentFileName != a.file.name) {
                    currentFileName = a.file.name;
                    currentFolderName = a.folder;
                    if (i_isForMindmap == false) {
                        text += this.settings.pdf_f_prb.replace("{fileName}",currentFileName);
                    }
                    else {
                        text += "### [[" + currentFileName + "]]\n";
                        if(this.settings.mm_preamb)
                        { text += "#### _\n"; }
                    }
                }
            }


            // Declare variables needed below
            let l_levelPrefix = "";
            let l_levelFormat = "";
            let l_levelIcon = "";
            let l_annoToReport = true;
            let l_title_lvl1 = "\n"+title_lvl1;


            // Add page number if needed
            if ((l_pageNumber != a.pageNumber) && (i_isForMindmap == false)) {// Annotations on a different page
                text_dt += "\n#### Page " + a.pageNumber + "\n";
                l_pageNumber = a.pageNumber;
                // In case of a page change, do not add a line before a level 1 title
                l_title_lvl1 = title_lvl1;
            }
            //else: Same page, nothing to do


            // Set variables depending on color
                // Get current annotation's color hue & lumi
            let annotColor    = convert.rgb.hsl(a.color);
            let annotColorHue = annotColor[0];
            let annotColorLum = annotColor[2];
            
                // Test if current annotation is recognized
            if( (Math.abs((100*(annotColorHue-color_lvl1Hue))/color_maxHue) <= this.settings.hueTol)  &&
                (Math.abs((100*(annotColorLum-color_lvl1Lum))/color_maxLum) <= this.settings.LumiTol) ) 
            {// Color for level 1
                l_levelPrefix += l_title_lvl1;
                l_previousLevel = lvl2_prefix;
                l_isPrevBullet = false;
                l_levelFormat = lvl1_format;
                l_levelIcon = lvl1_icon;
            }
            else if( (Math.abs((100*(annotColorHue-color_lvl2Hue))/color_maxHue) <= this.settings.hueTol)  &&
                     (Math.abs((100*(annotColorLum-color_lvl2Lum))/color_maxLum) <= this.settings.LumiTol) )
            {// Color for level 2
                if (i_isGetNrml) {// Annotation to report
                    l_levelPrefix = lvl2_prefix;
                    l_previousLevel = l_levelPrefix;
                    l_isPrevBullet = true;
                    l_levelFormat = lvl2_format;
                    l_levelIcon = lvl2_icon;
                }
                else { l_annoToReport = false; }
            }
            else if( (Math.abs((100*(annotColorHue-color_lvl3Hue))/color_maxHue) <= this.settings.hueTol)  &&
                     (Math.abs((100*(annotColorLum-color_lvl3Lum))/color_maxLum) <= this.settings.LumiTol) ) 
            {// Color for level 3
                if (i_isGetLow) {// Annotation to report
                    l_levelPrefix = lvl3_prefix;
                    l_previousLevel = l_levelPrefix;
                    if (l_isPrevBullet == false) {// We have a bullet level 2 but there was no level 1: Add one
                        text_cd += "- _{Low importance} :_\n";
                    }
                    l_isPrevBullet = true;
                    l_levelFormat = lvl3_format;
                    l_levelIcon = lvl3_icon;
                }
                else { l_annoToReport = false; }
            }
            else if( (Math.abs((100*(annotColorHue-color_sumrHue))/color_maxHue) <= this.settings.hueTol)  &&
                     (Math.abs((100*(annotColorLum-color_sumrLum))/color_maxLum) <= this.settings.LumiTol) ) 
            {// Color for summary
                l_levelPrefix = l_previousLevel;
                l_isPrevBullet = true;
                l_levelFormat = sumr_format;
                l_levelIcon = sumr_icon;
            }
            else if( (Math.abs((100*(annotColorHue-color_imptHue))/color_maxHue) <= this.settings.hueTol)  &&
                     (Math.abs((100*(annotColorLum-color_imptLum))/color_maxLum) <= this.settings.LumiTol) ) 
            {// Color for important notation
                l_levelPrefix = l_previousLevel;
                l_isPrevBullet = true;
                l_levelFormat = impt_format;
                l_levelIcon = impt_icon;
            }
            else {// Unknown color
                if (i_isGetNrml && i_isGetLow) {// Annotation to report
                    l_levelPrefix = "- ";
                    l_previousLevel = l_levelPrefix;
                    l_isPrevBullet = true;
                    l_levelIcon = unkn_icon;
                    // No level format
                }
                else { l_annoToReport = false; }
            }


            // Add current annotation to detailed/condensed strings
            let l_subtype = a.subtype;
            if (l_annoToReport) {// Annotation to report
                if (l_subtype == 'Text') {// Annotation: Note
                    let l_details = note(a);

                    while ((l_details.substring(0, 1) == " ") || (l_details.substring(0, 1) == "\n")) {// Remove leading whitespace / new line
                        l_details = l_details.substring(1);
                    }
                    while ((l_details.substring(l_details.length - 1) == " ") || (l_details.substring(l_details.length - 1) == "\n")) {// Remove trailing whitespace / new line
                        l_details = l_details.substring(0, l_details.length - 1);
                    }
                    
                    if(i_isForMindmap == false)
                    {// Replace carriage return in notes (doesn't work with l_details.replace('\r',"<br>"))
                        // l_details.replace('\r',"<br>");
                        // l_details.replace('\n',"<br>");
                        if( (l_details.includes('\r'))  ||
                            (l_details.includes('\n'))  )
                        {// There is carriage return(s)
                            // Replace \r
                            let l_note = l_details.split('\r');
                            l_details = "";
                            for (let i = 0; i < l_note.length-1; i++) {
                                l_details += l_note[i];
                                if(i < l_note.length-1)
                                { l_details += "<br>"; }
                            }
                            // Replace \n
                            l_note = l_details.split('\n');
                            for (let i = 0; i < l_note.length-1; i++) {
                                l_details += l_note[i];
                                if(i < l_note.length-1)
                                { l_details += "<br>"; }
                            }
                        }
                    }
                    
                    if (l_levelPrefix == l_title_lvl1) {
                        if (i_isForMindmap == false)
                        {   text_dt += l_title_lvl1; }
                        text_cd += '\n'+title_lvl1;
                    }
                    else {
                        if (i_isForMindmap == false)
                        { text_dt += "> "; }
                        text_cd += "- ";
                    }

                    if (i_isForMindmap == false)
                    { text_dt += l_levelFormat + note_preamb + note_format + l_levelIcon + l_details + note_format + l_levelFormat + "\n"; }
                    
                    text_cd   += l_levelFormat + note_preamb + note_format + l_levelIcon + l_details + note_format + l_levelFormat + "\n";
                } else {// Annotation: Highlight or underline
                    let l_details = highlighted(a);

                    while ((l_details.substring(0, 1) == " ") || (l_details.substring(0, 1) == "\n")) {// Remove leading whitespace / new line
                        l_details = l_details.substring(1);
                    }
                    while ((l_details.substring(l_details.length - 1) == " ") || (l_details.substring(l_details.length - 1) == "\n")) {// Remove trailing whitespace / new line
                        l_details = l_details.substring(0, l_details.length - 1);
                    }

                    if(i_isForMindmap == false)
                    {// Replace carriage return in notes (doesn't work with l_details.replace('\r',"<br>"))
                        // l_details.replace('\r',"<br>");
                        // l_details.replace('\n',"<br>");
                        if( (l_details.includes('\r'))  ||
                            (l_details.includes('\n'))  )
                        {// There is carriage return(s)
                            // Replace \r
                            let l_note = l_details.split('\r');
                            l_details = "";
                            for (let i = 0; i < l_note.length-1; i++) {
                                l_details += l_note[i];
                                if(i < l_note.length-1)
                                { l_details += "<br>"; }
                            }
                            // Replace \n
                            l_note = l_details.split('\n');
                            for (let i = 0; i < l_note.length-1; i++) {
                                l_details += l_note[i];
                                if(i < l_note.length-1)
                                { l_details += "<br>"; }
                            }
                        }
                    }

                    if (l_levelPrefix == l_title_lvl1) {// Level 1 -> Title: do not set a format (except italics for a Note)
                        if (i_isForMindmap == false)
                        {   text_dt += l_title_lvl1; }
                        text_cd += '\n'+title_lvl1;
                        // Highlight, and not text(=Note)
                        l_levelFormat = "";
                    }
                    else {// Not level 1
                        if (i_isForMindmap == false)
                        { text_dt += "> "; }
                        text_cd += l_levelPrefix;
                    }

                    if (i_isForMindmap == false)
                    { text_dt += l_levelIcon + l_levelFormat + l_details + l_levelFormat + "\n"; }
                    
                    text_cd   += l_levelIcon + l_levelFormat + l_details + l_levelFormat + "\n";
                }
            }
            // else: Not an annotation to report
        })


        // Add current annotation to global string
        // Formatting presentation:
        let l_FormattageText = "";
        
        if (i_isForMindmap) { l_FormattageText += "##"; }
        l_FormattageText += "## Format\n";
        
        l_FormattageText += title_lvl1  + lvl1_icon + lvl1_format + " Level 1 ("        + getColorName(this.settings.level1RGB) + ")" + lvl1_format + "\n";
        l_FormattageText += "- "        + lvl2_icon + lvl2_format + " Level 2 ("        + getColorName(this.settings.level2RGB) + ")" + lvl2_format + "\n";
        l_FormattageText += "  - "      + lvl3_icon + lvl3_format + " Level 3 ("        + getColorName(this.settings.level3RGB) + ")" + lvl3_format + "\n";
        
        if (i_isForMindmap) { l_FormattageText += "- "; }
        l_FormattageText +=               sumr_icon + sumr_format + "Special level 1 (" + getColorName(this.settings.summryRGB) + ")" + sumr_format + "\n";
        
        if (i_isForMindmap) { l_FormattageText += "- "; }
        l_FormattageText +=               impt_icon + impt_format + "Special level 2 (" + getColorName(this.settings.imprttRGB) + ")" + impt_format + "\n";
        
        if (i_isForMindmap) { l_FormattageText += "- "; }
        l_FormattageText += note_preamb +             note_format + "Note content"      +                                               note_format + "\n";

        if (i_isForMindmap == false) {
            text += l_FormattageText;
        }

        if (i_isForMindmap == false) {
            text += "\n\n---\n## Annotations\n";
            text += this.settings.perso_prb + "\n"
            text += "[[" + currentFileName + "]]\n- \n\n\n---\n";
            text += this.settings.conds_prb + "\n";
            text += "[[" + currentFileName + "]]\n";

            text += "#### PDF annotations\n";
        }

        text += text_cd;
        if (i_isForMindmap == false) {
            text += "\n\n\n---\n" + this.settings.detal_prb + "\n";
            text += "[[" + currentFileName + "]]\n";
            text += text_dt;
        }

        if (grandtotal.length == 0) {
            return ("\n" + this.settings.no_an_prb + "\n");
        }
        else return text;
    } // end of format(grandtotal, ...)


    // Function when called from a PDF file
    async loadSinglePDFFile(file: TFile) {
        const pdfjsLib = await loadPdfJs()
        const containingFolder = file.parent.name;
        const grandtotal = [] // array that will contain all fetched Annotations
        console.log('loading from file ', file)
        await loadPDFFile(file, pdfjsLib, containingFolder, grandtotal)
        this.sort(grandtotal)

        // Get file name
        let filePath = file.path.replace(".pdf", "");

        // First file: detailed & condensed versions
            // File name
        let l_fileName_1 = filePath + ".md";
            // Generate annotations
        let finalMarkdown = this.format(grandtotal, false, true, true)
            // Save annotations in file
        await saveDataToFile(l_fileName_1, finalMarkdown);
            // Open file
        await this.app.workspace.openLinkText(l_fileName_1, '', true);

        // Second file: mindmap, full version
        if(this.settings.mm_fl_tog) {
            let l_fileName_2 = filePath + " " + this.settings.mm_fl_suf + ".md";
            finalMarkdown = this.format(grandtotal, true, true, true)
            await saveDataToFile(l_fileName_2, finalMarkdown);
            await this.app.workspace.openLinkText(l_fileName_2, '', true);
        }

        // Third file: mindmap, essentials version
        if(this.settings.mm_fl_tog) {
            //let l_fileName_3 = filePath + " (mindmap essential).md";
            let l_fileName_3 = filePath + " " + this.settings.mm_es_suf + ".md";
            finalMarkdown = this.format(grandtotal, true, false, false)
            await saveDataToFile(l_fileName_3, finalMarkdown);
            await this.app.workspace.openLinkText(l_fileName_3, '', true);
        }

    }


    // Function when plugin is loaded
    async onload() {
        this.loadSettings();
        this.addSettingTab(new PDFAnnotationPluginSettingTab(this.app, this));


        // Command when called from a PDF file
        this.addCommand({
            id: 'extract-annotations-single',
            name: 'Extract PDF Annotations on single file',
            checkCallback: (checking: boolean) => {
                const file = this.app.workspace.getActiveFile();
                if (file != null && file.extension === 'pdf') {
                    if (!checking) {
                        // load file if (not only checking) && conditions are valid
                        this.loadSinglePDFFile(file)
                    }
                    return true
                } else {
                    return false
                }
            }
        })


        // Command when called from a md file:
        // Annotation as detailed & condensed formats
        this.addCommand({
            id: 'extract-annotations',
            name: 'Extract PDF Annotations',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const file = this.app.workspace.getActiveFile()
                if (file == null) return
                const folder = file.parent
                const grandtotal = [] // array that will contain all fetched Annotations

                const pdfjsLib = await loadPdfJs()

                const promises = [] // when all Promises will be resolved. 

                Vault.recurseChildren(folder, async (file) => {
                    // visit all Childern of parent folder of current active File
                    if (file instanceof TFile) {
                        if (file.extension === 'pdf') {
                            promises.push(loadPDFFile(file, pdfjsLib, file.parent.name, grandtotal))
                        }
                    }
                })
                await Promise.all(promises)
                this.sort(grandtotal)
                editor.replaceSelection(this.format(grandtotal, false, true, true))
            }
        })


        // Command when called from a md file:
        // Annotation as mindmap format
        this.addCommand({
            id: 'extract-annotations-mindmap',
            name: 'Extract PDF Annotations (Mindmap format)',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const file = this.app.workspace.getActiveFile()
                if (file == null) return
                const folder = file.parent
                const grandtotal = [] // array that will contain all fetched Annotations

                const pdfjsLib = await loadPdfJs()

                const promises = [] // when all Promises will be resolved. 

                Vault.recurseChildren(folder, async (file) => {
                    // visit all Childern of parent folder of current active File
                    if (file instanceof TFile) {
                        if (file.extension === 'pdf') {
                            promises.push(loadPDFFile(file, pdfjsLib, file.parent.name, grandtotal))
                        }
                    }
                })
                await Promise.all(promises)
                this.sort(grandtotal)
                editor.replaceSelection(this.format(grandtotal, true, true, true))
            }
        })


        // Command when called from a md file:
        // Annotation as mindmap format only for summary & important annot.
        this.addCommand({
            id: 'extract-annotations-mindmap-summary-important',
            name: 'Extract PDF Annotations (Mindmap format, summary & important only)',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const file = this.app.workspace.getActiveFile()
                if (file == null) return
                const folder = file.parent
                const grandtotal = [] // array that will contain all fetched Annotations

                const pdfjsLib = await loadPdfJs()

                const promises = [] // when all Promises will be resolved. 

                Vault.recurseChildren(folder, async (file) => {
                    // visit all Childern of parent folder of current active File
                    if (file instanceof TFile) {
                        if (file.extension === 'pdf') {
                            promises.push(loadPDFFile(file, pdfjsLib, file.parent.name, grandtotal))
                        }
                    }
                })
                await Promise.all(promises)
                this.sort(grandtotal)
                editor.replaceSelection(this.format(grandtotal, true, false, false))
            }


        })
    }


    // Load settings from settings pane
    loadSettings() {
        this.settings = new PDFAnnotationPluginSetting();
        (async () => {
            const loadedSettings = await this.loadData();
            if (loadedSettings) {
                this.settings.useFolderNames = loadedSettings.useFolderNames;
                this.settings.sortByTopic = loadedSettings.sortByTopic;
            }
        })();
    }


    onunload() { }


}
