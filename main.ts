import { App, Editor, MarkdownView, TFile, Vault, Plugin, PluginSettingTab, Setting, loadPdfJs } from 'obsidian';
import { loadPDFFile } from 'extractHighlight'

// npm install obsidian


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

// templates for different types of Annotations
//const highlighted = template`> ${'highlightedText'}
// var highlighted = template`* *Page ${"pageNumber"} by ${"author"} on [[${"filepath"}]]*
// var highlighted = template`- *Page ${"pageNumber"}:* 
// > ${"highlightedText"}
// 
// `;
// 

// Colors' definition
const color_lvl1 = [255, 173, 91];      // Orange
const color_lvl2 = [255, 255, 0];       // Yellow
const color_lvl3 = [209, 223, 235];     // Light blue
const color_summary = [0, 255, 0];      // Green
const color_important = [252, 54, 54];	// Red
const color_Min = 60;
const color_Max = 60;

// Formatting
const title_lvl1 = "\n###### ";
const lvl1_format = "";
const lvl2_format = "";
const lvl3_format = "";
const sumr_format = "**";
const impt_format = "==";
const note_format =  "_";
const note_preamb = "**Note:** ";
const lvl2_prefix = "- ";
const lvl3_prefix = "	- ";
const lvl1_icon = "🟠 ";
const lvl2_icon = "🟡 ";
const lvl3_icon = "🔵 ";
const sumr_icon = "🟢 ";
const impt_icon = "🔴 ";
const unkn_icon = "⍰ ";
// Other emojis: ⚫⚪🟣🟤⍰
var highlighted = template`${"highlightedText"}`;
//var highlighted_Condensed = template`${"highlightedText"}`;

// var note = template`* *Page ${"pageNumber"} by ${"author"} on [[${"filepath"}]]*
var note = template`${'body'}`;
//var note_Condensed = template`${'body'}`;


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

    format(grandtotal, i_isForMindmap: boolean, i_isGetNrml: boolean, i_isGetLow: boolean, ) {
        // Args:
            // grandtotal:     list of annotations
            // i_isForMindmap: true if extraction for mindmap
            // i_isGetNrml:    true if extraction of normal priority infos (yellow)
            // i_isGetLow:     true if extraction of low    priority infos (light blue)
        // now iterate over the annotations printing topics, then folder, then comments...
        let text = ''
        if (i_isForMindmap == false)
        {    var text_dt = '';    }
        let text_cd = '';
        //let text_3 = '';
        let topic = '';
        let currentFolder = '';

        let currentFolderName = ""; // SeG
        let l_pageNumber = 0;
        let l_previousLevel = "";
        let l_isPrevBullet = false;

        // console.log("all annots", grandtotal)
        grandtotal.forEach((a) => {
            // print main Title when Topic changes (and settings allow)
            if (this.settings.sortByTopic) {
                if (topic != a.topic) {
                    topic = a.topic
                    currentFolder = ''
                    //text += `# ${topic}\n`
                    text += `
# ${topic}
`;
                }
            }

            if (this.settings.useFolderNames) {
                if (currentFolder != a.folder) {
                    //currentFolder = a.folder
                    //text += `## ${currentFolder}\n`
                    currentFolder = a.file.name;
                    currentFolderName = a.folder; // SeG
                    if(i_isForMindmap == false) {
                        text += `
## Infos note
### Références
- [[${currentFolder}]]

### Lien :
- 

### Concepts clés
- 


---
\`\`\`toc
\`\`\`
---
`;

                    }
                    else {
                        text += "### [["+currentFolder+"]]\n";
                    }
                }
            } else {
                if (currentFolder != a.file.name) {
                    currentFolder = a.file.name
                    //text += `## ${currentFolder}\n`
                    currentFolderName = a.folder; // SeG
                    if(i_isForMindmap == false) {
                        text += `
## Infos note
### Références
- [[${currentFolder}]]

### Lien :
- 

### Concepts clés
- 


---
\`\`\`toc
\`\`\`
---
`;
                    }
                    else {
                        text += "### [["+currentFolder+"]]\n";
                    }
                }
            }

            //console.log("Couleur: "+a.color);
            if( (l_pageNumber != a.pageNumber) && (i_isForMindmap == false) )
            {// Annotations on a different page
                text_dt += "\n##### Page " + a.pageNumber + "\n";
                l_pageNumber = a.pageNumber;
            }
            //else: Same page, nothing to do

            let l_levelPrefix = "";
            let l_levelFormat = "";
            let l_levelIcon   = "";
            let l_annoToReport = true;

            if ((a.color[0] >= (color_lvl1[0] - color_Min)) && (a.color[0] <= (color_lvl1[0] + color_Max)) &&
                (a.color[1] >= (color_lvl1[1] - color_Min)) && (a.color[1] <= (color_lvl1[1] + color_Max)) &&
                (a.color[2] >= (color_lvl1[2] - color_Min)) && (a.color[2] <= (color_lvl1[2] + color_Max))) {// Color for level 1
                l_levelPrefix     = title_lvl1;
                l_previousLevel   = lvl2_prefix;
                l_isPrevBullet    = false;
                l_levelFormat     = lvl1_format;
                l_levelIcon       = lvl1_icon;
            }
            else if ((a.color[0] >= (color_lvl2[0] - color_Min)) && (a.color[0] <= (color_lvl2[0] + color_Max)) &&
                     (a.color[1] >= (color_lvl2[1] - color_Min)) && (a.color[1] <= (color_lvl2[1] + color_Max)) &&
                     (a.color[2] >= (color_lvl2[2] - color_Min)) && (a.color[2] <= (color_lvl2[2] + color_Max))) {// Color for level 2
                if(i_isGetNrml)
                {// Annotation to report
                    l_levelPrefix     = lvl2_prefix;
                    l_previousLevel   = l_levelPrefix;
                    l_isPrevBullet    = true;
                    l_levelFormat     = lvl2_format;
                    l_levelIcon       = lvl2_icon;
                }
                else
                {   l_annoToReport    = false; }
            }
            else if ((a.color[0] >= (color_lvl3[0] - color_Min)) && (a.color[0] <= (color_lvl3[0] + color_Max)) &&
                     (a.color[1] >= (color_lvl3[1] - color_Min)) && (a.color[1] <= (color_lvl3[1] + color_Max)) &&
                     (a.color[2] >= (color_lvl3[2] - color_Min)) && (a.color[2] <= (color_lvl3[2] + color_Max))) {// Color for level 3
                if(i_isGetLow)
                {// Annotation to report
                    l_levelPrefix     = lvl3_prefix;
                    l_previousLevel   = l_levelPrefix;
                    if (l_isPrevBullet == false) {// We have a bullet level 2 but there was no level 1: Add one
                        text_cd += "- _{Faible importance} :_\n";
                    }
                    l_isPrevBullet    = true;
                    l_levelFormat     = lvl3_format;
                    l_levelIcon       = lvl3_icon;
                }
                else
                {   l_annoToReport    = false; }
            }
            else if ((a.color[0] >= (color_summary[0] - color_Min)) && (a.color[0] <= (color_summary[0] + color_Max)) &&
                     (a.color[1] >= (color_summary[1] - color_Min)) && (a.color[1] <= (color_summary[1] + color_Max)) &&
                     (a.color[2] >= (color_summary[2] - color_Min)) && (a.color[2] <= (color_summary[2] + color_Max))) {// Color for summary
                l_levelPrefix    = l_previousLevel;
                l_isPrevBullet   = true;
                l_levelFormat    = sumr_format;
                l_levelIcon      = sumr_icon;
            }
            else if ((a.color[0] >= (color_important[0] - color_Min)) && (a.color[0] <= (color_important[0] + color_Max)) &&
                     (a.color[1] >= (color_important[1] - color_Min)) && (a.color[1] <= (color_important[1] + color_Max)) &&
                     (a.color[2] >= (color_important[2] - color_Min)) && (a.color[2] <= (color_important[2] + color_Max))) {// Color for important notation
                l_levelPrefix    = l_previousLevel;
                l_isPrevBullet   = true;
                l_levelFormat    = impt_format;
                l_levelIcon      = impt_icon;
            }
            else {// Unknown color
                if(i_isGetNrml && i_isGetLow)
                {// Annotation to report
                    l_levelPrefix    = "- ";
                    l_previousLevel  = l_levelPrefix;
                    l_isPrevBullet   = true;
                    l_levelIcon      = unkn_icon;
                    // No level format
                }
                else
                {   l_annoToReport   = false; }
            }

            let l_subtype = a.subtype;
            if( l_annoToReport )
            {// Annotation to report
                if (l_subtype == 'Text') {// Notes
                    let l_details = note(a);
    
                    while ((l_details.substring(0, 1) == " ") || (l_details.substring(0, 1) == "\n"))
                    {// Remove leading whitespace / new line
                        l_details = l_details.substring(1);
                    }
                    while ((l_details.substring(l_details.length - 1) == " ") || (l_details.substring(l_details.length - 1) == "\n"))
                    {// Remove trailing whitespace / new line
                        l_details = l_details.substring(0, l_details.length - 1);
                    }
    
                    /*let l_condensed = l_details;//note_Details(a);//note_Condensed(a);
                    while ((l_condensed.substring(0, 1) == " ") || (l_condensed.substring(0, 1) == "\n")) {// Remove leading whitespace / new line
                        l_condensed = l_condensed.substring(1);
                    }
                    while ((l_condensed.substring(l_condensed.length - 1) == " ") || (l_condensed.substring(l_condensed.length - 1) == "\n")) {// Remove trailing whitespace / new line
                        l_condensed = l_condensed.substring(0, l_condensed.length - 1);
                    }*/
    
                    if (l_levelPrefix == title_lvl1) {
                        if(i_isForMindmap == false)
                        {    text_dt += title_lvl1; }
                        text_cd += title_lvl1;
                    }
                    else {
                        if(i_isForMindmap == false)
                        {    text_dt += "> "; }
                        text_cd += "- ";
                    }
    
                    if(i_isForMindmap == false)
                    { text_dt += note_preamb + l_levelIcon + note_format + l_levelFormat + l_details + l_levelFormat + note_format + "\n"; }
                    text_cd   += note_preamb + l_levelIcon + note_format + l_levelFormat + l_details + l_levelFormat + note_format + "\n";
                    //text_3 += note_Mindmap(a);
    
                } else {// Highlight
                    let l_details = highlighted(a);
    
                    while ((l_details.substring(0, 1) == " ") || (l_details.substring(0, 1) == "\n")) {// Remove leading whitespace / new line
                        l_details = l_details.substring(1);
                    }
                    while ((l_details.substring(l_details.length - 1) == " ") || (l_details.substring(l_details.length - 1) == "\n")) {// Remove trailing whitespace / new line
                        l_details = l_details.substring(0, l_details.length - 1);
                    }
    
                    /*let l_condensed = l_details; //highlighted_Details(a);//highlighted_Condensed(a);
                    while ((l_condensed.substring(0, 1) == " ") || (l_condensed.substring(0, 1) == "\n")) {// Remove leading whitespace / new line
                        l_condensed = l_condensed.substring(1);
                    }
                    while ((l_condensed.substring(l_condensed.length - 1) == " ") || (l_condensed.substring(l_condensed.length - 1) == "\n")) {// Remove trailing whitespace / new line
                        l_condensed = l_condensed.substring(0, l_condensed.length - 1);
                    }*/
    
                    if (l_levelPrefix == title_lvl1) {// Level 1 -> Title: do not set a format (except italics for a Note)
                        if(i_isForMindmap == false)
                        {    text_dt += title_lvl1; }
                        // Highlight, and not text(=Note)
                        l_levelFormat = "";
                    }
                    else {// Not level 1
                        if(i_isForMindmap == false)
                        {    text_dt += "> "; }
                    }
    
                    if(i_isForMindmap == false)
                    { text_dt +=                 l_levelIcon + l_levelFormat + l_details + l_levelFormat + "\n"; }
                    text_cd   += l_levelPrefix + l_levelIcon + l_levelFormat + l_details + l_levelFormat + "\n";
                }
            }
            // else: Not an annotation to report
        })

        if(i_isForMindmap)
        {   text += "###"; }
        text += "## Formattage";
        if(i_isForMindmap == false)
        {   text += " (selon couleur surlignement / note)"; }
        text += "\n###### "+ lvl1_icon +" Orange\n";
        text += "- "+ lvl2_icon +" Jaune\n";
        text += "  - "+ lvl3_icon +" Bleu clair\n";
        if(i_isForMindmap)
        {   text += "- "; }
        text += sumr_icon+sumr_format+"Vert"+sumr_format+"\n";
        if(i_isForMindmap)
        {   text += "- "; }
        text += impt_icon+impt_format+"Rouge"+impt_format+"\n";
        if(i_isForMindmap)
        {   text += "- "; }
        text += note_preamb+note_format+"Contenu de la note"+note_format+"\n";
        text += '\n';
        if(i_isForMindmap == false) {
            text += "---\n## Annotations\n### Format condensé";
            text += "\n#### [[" + currentFolder + "]]\n";
        }
        //if(i_isForMindmap)
        { text += "##### PDF\n";      }
        text += text_cd;
        if(i_isForMindmap == false)
        {
            text += "\n\n---\n### Format détaillé\n";
            text += "\n#### [[" + currentFolder + "]]\n";
            text += text_dt;
        }
 
        if (grandtotal.length == 0) {
            return ("\n" + "- **No Annotations**" + "\n");
        }
        else return text
    }

    async loadSinglePDFFile(file: TFile) {
        const pdfjsLib = await loadPdfJs()
        const containingFolder = file.parent.name;
        const grandtotal = [] // array that will contain all fetched Annotations
        console.log('loading from file ', file)
        await loadPDFFile(file, pdfjsLib, containingFolder, grandtotal)
        this.sort(grandtotal)
        const finalMarkdown = this.format(grandtotal, false, true, true)

        let filePath = file.name.replace(".pdf", ".md");
        filePath = "Annotations for " + filePath;
        await this.saveHighlightsToFile(filePath, finalMarkdown);
        await this.app.workspace.openLinkText(filePath, '', true);
    }

    async onload() {
        this.loadSettings();
        this.addSettingTab(new PDFAnnotationPluginSettingTab(this.app, this));

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

        this.addCommand({
            id: 'extract-annotations',
            name: 'Extract PDF Annotations',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const file = this.app.workspace.getActiveFile()
                if (file == null) return
                const folder = file.parent
                const grandtotal = [] // array that will contain all fetched Annotations

                const pdfjsLib = await loadPdfJs()

                // Get date and time:
                const l_date = new Date();
                const l_day = String(l_date.getDate()).padStart(2, '0');
                const l_month = String(l_date.getMonth() + 1).padStart(2, '0');
                const l_year = String(l_date.getFullYear());
                const l_hours = String(l_date.getHours()).padStart(2, '0');
                const l_minutes = String(l_date.getMinutes()).padStart(2, '0');
                const l_dateTime = `${l_day}/${l_month}/${l_year} @${l_hours}:${l_minutes}`

                // Set beginning of file
                let l_1stText = `MOC : ==[[MAP_OF_CONTENT_1_MOC]]==
Source : _PDF comments extracted from file (see References)._
Type : #Type/Note/Info
Diffusion : #Diffusion/Perso
Notes liées : -
Date note : ${l_dateTime}
Note : #Interet/==TBD== /5

---`

                //editor.replaceSelection('Extracting PDF Comments from ' + folder.name + '\n')
                editor.replaceSelection(l_1stText)

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

        
        this.addCommand({
            id: 'extract-annotations-mindmap',
            name: 'Extract PDF Annotations (Mindmap format)',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const file = this.app.workspace.getActiveFile()
                if (file == null) return
                const folder = file.parent
                const grandtotal = [] // array that will contain all fetched Annotations

                const pdfjsLib = await loadPdfJs()

                // Set beginning of file
                let l_1stText = `---

mindmap-plugin: basic

---
`;      
                editor.replaceSelection(l_1stText)

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


        this.addCommand({
            id: 'extract-annotations-mindmap-summary-important',
            name: 'Extract PDF Annotations (Mindmap format, summary & important only)',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const file = this.app.workspace.getActiveFile()
                if (file == null) return
                const folder = file.parent
                const grandtotal = [] // array that will contain all fetched Annotations

                const pdfjsLib = await loadPdfJs()

                // Set beginning of file
                let l_1stText = `---

mindmap-plugin: basic

---
`;      
                editor.replaceSelection(l_1stText)

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

    async saveHighlightsToFile(filePath: string, mdString: string) {
        const fileExists = await this.app.vault.adapter.exists(filePath);
        if (fileExists) {
            await this.appendHighlightsToFile(filePath, mdString);
        } else {
            await this.app.vault.create(filePath, mdString);
        }
    }

    async appendHighlightsToFile(filePath: string, note: string) {
        let existingContent = await this.app.vault.adapter.read(filePath);
        if (existingContent.length > 0) {
            existingContent = existingContent + '\r\r';
        }
        await this.app.vault.adapter.write(filePath, existingContent + note);
    }


}



class PDFAnnotationPluginSetting {
    public useFolderNames: boolean;
    public sortByTopic: boolean;

    constructor() {
        this.useFolderNames = true;
        this.sortByTopic = true;
    }
}

class PDFAnnotationPluginSettingTab extends PluginSettingTab {
    plugin: PDFAnnotationPlugin;

    constructor(app: App, plugin: PDFAnnotationPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Use Folder Name')
            .setDesc(
                'If enabled, uses the PDF\'s folder name (instead of the PDF-Filename) for sorting',
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.useFolderNames).onChange((value) => {
                    this.plugin.settings.useFolderNames = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );

        new Setting(containerEl)
            .setName('Sort by Topic')
            .setDesc(
                'If enabled, uses the notes first line as Topic for primary sorting',
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.sortByTopic).onChange((value) => {
                    this.plugin.settings.sortByTopic = value;
                    this.plugin.saveData(this.plugin.settings);
                }),
            );

    }
}


