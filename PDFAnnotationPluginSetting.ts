// Settings handling for the PDF Extract annotation plugin
import PDFAnnotationPlugin from "./main";
import { App, PluginSettingTab, Setting } from 'obsidian';



export class PDFAnnotationPluginSetting {
    public useFolderNames: boolean;
    public sortByTopic: boolean;
    // Colors
    public level1RGB  : number[];
    public level2RGB  : number[];
    public level3RGB  : number[];
    public summryRGB  : number[];
    public imprttRGB  : number[];
    public hueTol     : number;
    public LumiTol    : number;
    // Formats
    public lvl1_format: string;
    public lvl2_format: string;
    public lvl3_format: string;
    public sumr_format: string;
    public impt_format: string;
    public note_format: string;
    public note_preamb: string;
    // Icons
    public lvl1_icon  : string;
    public lvl2_icon  : string;
    public lvl3_icon  : string;
    public sumr_icon  : string;
    public impt_icon  : string;
    public unkn_icon  : string;
    // Preambles
    public begin_prb  : string;
    public pdf_f_prb  : string;
    public perso_prb  : string;
    public conds_prb  : string;
    public detal_prb  : string;
    public no_an_prb  : string;
    // Mindmaps
    public mm_preamb  : boolean;
    public mm_fl_tog  : boolean;
    public mm_fl_suf  : string;
    public mm_es_tog  : boolean;
    public mm_es_suf  : string;
    
    constructor() {
        this.useFolderNames = true;
        this.sortByTopic    = true;
        this.level1RGB      = [255, 173,  91];
        this.level2RGB      = [255, 255,   0];
        this.level3RGB      = [209, 223, 235];
        this.summryRGB      = [  0, 255,   0];
        this.imprttRGB      = [252,  54,  54];
        this.hueTol         = 5;
        this.LumiTol        = 30;
        this.lvl1_format    = "";
        this.lvl2_format    = "";
        this.lvl3_format    = "";
        this.sumr_format    = "**";
        this.impt_format    = "==";
        this.note_format    = "_";
        this.note_preamb    = "Note:";
        this.lvl1_icon      = "🟠";
        this.lvl2_icon      = "🟡";
        this.lvl3_icon      = "🔵";
        this.sumr_icon      = "🟢";
        this.impt_icon      = "🔴";
        this.unkn_icon      = "⍰";
        // Other emojis: ⚫⚪🟣🟤⍰
        this.begin_prb      = `MOC : ==[[MAP_OF_CONTENT_1_MOC]]==
Source : _Annotations extracted from PDF file (see below)._
Type : #Type/Note/Info
Diffusion : #Diffusion/Perso
Notes liées : -
Date note : {dateTime}
Note : #Interet/==TBD== /5

---`;
        this.pdf_f_prb      = `
## Infos note
### Références
- [[{fileName}]]

### Lien :
- 

### Concepts clés
- 


---
\`\`\`toc
\`\`\`
---
`;
        this.perso_prb      = "### Synthèse perso";
        this.conds_prb      = "### Format condensé";
        this.detal_prb      = "### Format détaillé";
        this.no_an_prb      = "- **Aucune annotation**";
        this.mm_preamb      = true;
        this.mm_fl_tog      = true;
        this.mm_fl_suf      = "(mm)";
        this.mm_es_tog      = true;
        this.mm_es_suf      = "(mm essential)";
    }
}



export class PDFAnnotationPluginSettingTab extends PluginSettingTab {
    plugin: PDFAnnotationPlugin;

    constructor(app: App, plugin: PDFAnnotationPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Extract PDF Annotations options ' });

        
        // Setting: Folder name instead of file name
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


        // Setting: use 1st line as Topic
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


        // LEVELS: RGB VALUES, HUE TOLERANCE, LUMI TOLERANCE
            // LEVEL 1: Color
        new Setting(containerEl)
            .setName('Color: Level 1')
            .setDesc('R,G,B values for level 1 (separated by commas). Default: Orange (255,173, 91)')
            .addText(text => text
                .setValue(this.plugin.settings.level1RGB[0] +","+this.plugin.settings.level1RGB[1] +","+this.plugin.settings.level1RGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.level1RGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // LEVEL 2: Color
        new Setting(containerEl)
            .setName('Color: Level 2')
            .setDesc('R,G,B values for level 2 (separated by commas). Default: Yellow (255,255,  0)')
            .addText(text => text
                .setValue(this.plugin.settings.level2RGB[0] +","+this.plugin.settings.level2RGB[1] +","+this.plugin.settings.level2RGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.level2RGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // LEVEL 3: Color
        new Setting(containerEl)
            .setName('Color: Level 3')
            .setDesc('R,G,B values for level 3 (separated by commas). Default: Light blue (209,223,235)')
            .addText(text => text
                .setValue(this.plugin.settings.level3RGB[0] +","+this.plugin.settings.level3RGB[1] +","+this.plugin.settings.level3RGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.level3RGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // SUMMARY: Color
        new Setting(containerEl)
            .setName('Color: Special level (1)')
            .setDesc('R,G,B values for special level (1) such as summaries (separated by commas). Default: Green (  0, 255,  0)')
            .addText(text => text
                .setValue(this.plugin.settings.summryRGB[0] +","+this.plugin.settings.summryRGB[1] +","+this.plugin.settings.summryRGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.summryRGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // IMPORTANT: Color
        new Setting(containerEl)
            .setName('Color: Special level (2)')
            .setDesc('R,G,B values for special level (2) such as important annot. (separated by commas). Default: Red (252, 54, 54)')
            .addText(text => text
                .setValue(this.plugin.settings.imprttRGB[0] +","+this.plugin.settings.imprttRGB[1] +","+this.plugin.settings.imprttRGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.imprttRGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Hue tolerance
        new Setting(containerEl)
            .setName('Color: Hue tolerance (%)')
            .setDesc('Indicate the hue tolerance (in %) to recognize the colors. Default: 5')
            .addText(text => text
                .setValue(this.plugin.settings.hueTol.toString())
                .onChange(async (value) => {
                    this.plugin.settings.hueTol = parseInt(value);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Luminosity tolerance
        new Setting(containerEl)
            .setName('Color: Luminosity tolerance (%)')
            .setDesc('Indicate the luminosity tolerance (in %) to recognize the colors. Default: 30')
            .addText(text => text
                .setValue(this.plugin.settings.LumiTol.toString())
                .onChange(async (value) => {
                    this.plugin.settings.LumiTol = parseInt(value);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // FORMATS
            // Level 1
        new Setting(containerEl)
            .setName('Format: Level 1')
            .setDesc('Indicate the format for level 1 annotations. Default: [Empty]')
            .addText(text => text
                .setValue(this.plugin.settings.lvl1_format)
                .onChange(async (value) => {
                    this.plugin.settings.lvl1_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Level 2
        new Setting(containerEl)
            .setName('Format: Level 2')
            .setDesc('Indicate the format for level 2 annotations. Default: [Empty]')
            .addText(text => text
                .setValue(this.plugin.settings.lvl2_format)
                .onChange(async (value) => {
                    this.plugin.settings.lvl2_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Level 3
        new Setting(containerEl)
            .setName('Format: Level 3')
            .setDesc('Indicate the format for level 3 annotations. Default: [Empty]')
            .addText(text => text
                .setValue(this.plugin.settings.lvl3_format)
                .onChange(async (value) => {
                    this.plugin.settings.lvl3_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Summary
        new Setting(containerEl)
            .setName('Format: Summary')
            .setDesc('Indicate the format for summary annotations. Default: **')
            .addText(text => text
                .setValue(this.plugin.settings.sumr_format)
                .onChange(async (value) => {
                    this.plugin.settings.sumr_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Important
        new Setting(containerEl)
            .setName('Format: Important')
            .setDesc('Indicate the format for important annotations. Default: ==')
            .addText(text => text
                .setValue(this.plugin.settings.impt_format)
                .onChange(async (value) => {
                    this.plugin.settings.impt_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Notes
        new Setting(containerEl)
            .setName('Format: Notes')
            .setDesc('Indicate the format for notes. Default: _')
            .addText(text => text
                .setValue(this.plugin.settings.note_format)
                .onChange(async (value) => {
                    this.plugin.settings.note_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // NOTE PREAMBLE
        new Setting(containerEl)
            .setName('Preamble: Notes')
            .setDesc('Indicate the notes\'preamble. Default: **Note:**')
            .addText(text => text
                .setValue(this.plugin.settings.note_preamb)
                .onChange(async (value) => {
                    this.plugin.settings.note_preamb = value+" ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // ICONS
            // Level 1
        new Setting(containerEl)
            .setName('Icons: Level 1')
            .setDesc('Indicate the icon for level 1 annotations. Default: 🟠')
            .addText(text => text
                .setValue(this.plugin.settings.lvl1_icon)
                .onChange(async (value) => {
                    this.plugin.settings.lvl1_icon = value+" ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Level 2
        new Setting(containerEl)
            .setName('Icons: Level 2')
            .setDesc('Indicate the icon for level 2 annotations. Default: 🟡')
            .addText(text => text
                .setValue(this.plugin.settings.lvl2_icon)
                .onChange(async (value) => {
                    this.plugin.settings.lvl2_icon = value+" ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Level 3
        new Setting(containerEl)
            .setName('Icons: Level 3')
            .setDesc('Indicate the icon for level 3 annotations. Default: 🔵')
            .addText(text => text
                .setValue(this.plugin.settings.lvl3_icon)
                .onChange(async (value) => {
                    this.plugin.settings.lvl3_icon = value+" ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Summmary
        new Setting(containerEl)
            .setName('Icons: Summary')
            .setDesc('Indicate the icon for summaries annotations. Default: 🟢')
            .addText(text => text
                .setValue(this.plugin.settings.sumr_icon)
                .onChange(async (value) => {
                    this.plugin.settings.sumr_icon = value+" ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Important
        new Setting(containerEl)
            .setName('Icons: Important')
            .setDesc('Indicate the icon for important annotations. Default: 🔴')
            .addText(text => text
                .setValue(this.plugin.settings.impt_icon)
                .onChange(async (value) => {
                    this.plugin.settings.impt_icon = value+" ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Unknown
        new Setting(containerEl)
            .setName('Icons: Unknown')
            .setDesc('Indicate the icon for unknown\'s level annotations. Default: ⍰')
            .addText(text => text
                .setValue(this.plugin.settings.unkn_icon)
                .onChange(async (value) => {
                    this.plugin.settings.unkn_icon = value+" ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // PREAMBLES
            // File's beginning
            new Setting(containerEl)
            .setName('Preambles: File beginning')
            .setDesc('Text inserted at the file\'s beginning. \nThe marker {dateTime} will be replaced by\nthe date/Time in \"DD/MM/YYYY @HH:mm\" format')
            .addTextArea(text => {
                text.inputEl.style.width  = '100%'
                text.inputEl.style.height = '200px'
                text.setValue(this.plugin.settings.begin_prb)
                text.onChange(async (value) => {
                    this.plugin.settings.begin_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                });
            });


            // PDF file preamble
            new Setting(containerEl)
            .setName('Preambles: PDF')
            .setDesc('Text inserted at each new PDF.\nThe marker {fileName} will be replaced by\nthe PDF file name')
            .addTextArea(text => {
                text.inputEl.style.width  = '100%'
                text.inputEl.style.height = '250px'
                text.setValue(this.plugin.settings.pdf_f_prb)
                text.onChange(async (value) => {
                    this.plugin.settings.pdf_f_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                });
    });


            // Manual personal annotations preamble
            new Setting(containerEl)
            .setName('Preambles: Manual personal annotations')
            .setDesc('Preamble for manual annotations to add to the extracted ones. Default: ### Synthèse perso')
            .addText(text => text
                .setValue(this.plugin.settings.perso_prb)
                .onChange(async (value) => {
                    this.plugin.settings.perso_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Condensed annotations preamble
            new Setting(containerEl)
            .setName('Preambles: Condensed')
            .setDesc('Preamble for the condensed annotations. Default: ### Format condensé')
            .addText(text => text
                .setValue(this.plugin.settings.conds_prb)
                .onChange(async (value) => {
                    this.plugin.settings.conds_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Detailed annotations preamble
            new Setting(containerEl)
            .setName('Preambles: Detailed')
            .setDesc('Preamble for the detailed annotations. Default: ### Format détaillé')
            .addText(text => text
                .setValue(this.plugin.settings.detal_prb)
                .onChange(async (value) => {
                    this.plugin.settings.detal_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // No annotation preamble
            new Setting(containerEl)
            .setName('Preambles: No annotation')
            .setDesc('Preamble in case there is no annotation. Default: - **Aucune annotation**')
            .addText(text => text
                .setValue(this.plugin.settings.conds_prb)
                .onChange(async (value) => {
                    this.plugin.settings.conds_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );



        // MINMAPS
            // Mindmap premble
            new Setting(containerEl)
            .setName('Mindmap: Add a level')
            .setDesc('If enabled, add a level containing all nodes to save space',)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.mm_preamb).onChange((value) => {
                    this.plugin.settings.mm_preamb = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );


            // Full mindmap toggle
            new Setting(containerEl)
            .setName('From PDF: Generate full mindmap')
            .setDesc('If enabled, generate the full mindmap when calling the plugin from a PDF file',)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.mm_fl_tog).onChange((value) => {
                    this.plugin.settings.mm_es_tog = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );


            // Full mindmap file's suffixe
            new Setting(containerEl)
            .setName('File suffixes: Full mindmap')
            .setDesc('File\'s suffixe for the mindmap file. Default: (mm)')
            .addText(text => text
                .setValue(this.plugin.settings.mm_fl_suf)
                .onChange(async (value) => {
                    this.plugin.settings.mm_fl_suf = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // Essential mindmap toggle
            new Setting(containerEl)
            .setName('From PDF: Generate essentials mindmap')
            .setDesc('If enabled, generate the mindmap with essentials (special levels) annotations when calling the plugin from a PDF file',)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.mm_es_tog).onChange((value) => {
                    this.plugin.settings.mm_es_tog = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );


            // Mindmap of essentials file's suffixe
            new Setting(containerEl)
            .setName('File suffixes: Mindmap of essentials')
            .setDesc('File\'s suffixe for the mindmap with only essentials (special levels) annotations. Default: (mm essential)')
            .addText(text => text
                .setValue(this.plugin.settings.mm_es_suf)
                .onChange(async (value) => {
                    this.plugin.settings.mm_es_suf = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


    }
}
