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
        this.note_preamb    = "**Note:**";
        this.lvl1_icon      = "🟠";
        this.lvl2_icon      = "🟡";
        this.lvl3_icon      = "🔵";
        this.sumr_icon      = "🟢";
        this.impt_icon      = "🔴";
        this.unkn_icon      = "⍰";
        // Other emojis: ⚫⚪🟣🟤⍰
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
            .setName('Color: Summary')
            .setDesc('R,G,B values for summaries (separated by commas). Default: Green (  0, 255,  0)')
            .addText(text => text
                .setValue(this.plugin.settings.summryRGB[0] +","+this.plugin.settings.summryRGB[1] +","+this.plugin.settings.summryRGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.summryRGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


            // IMPORTANT: Color
        new Setting(containerEl)
            .setName('Color: Important')
            .setDesc('R,G,B values for important annot. (separated by commas). Default: Red (252, 54, 54)')
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


    }
}
