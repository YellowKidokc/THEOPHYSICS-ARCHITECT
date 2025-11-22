import { Plugin, TFile, Notice, normalizePath, App, PluginSettingTab, Setting } from 'obsidian';

// === CONFIGURATION ===
interface ArchitectSettings {
    analysisFolder: string;
    schema: {
        level1: string; // Signal
        level2: string; // Pattern
        level3: string; // Constant
    };
}

const DEFAULT_SETTINGS: ArchitectSettings = {
    analysisFolder: 'Data Analytics', // <--- UPDATED HERE
    schema: {
        level1: 'Signal',
        level2: 'Pattern',
        level3: 'Constant'
    }
};

export default class TheophysicsArchitect extends Plugin {
    settings: ArchitectSettings;

    async onload() {
        await this.loadSettings();

        // 1. COMMAND: Generate Local Map (The Surgical Tool)
        this.addCommand({
            id: 'architect-local-map',
            name: 'Generate Local Breakthrough Map',
            editorCallback: async (editor, view) => {
                const file = view.file;
                if (!file) return;
                new Notice(`Architect: Analyzing ${file.basename}...`);
                const mapData = await this.scanConnections(file);
                const mermaidCode = this.generateMermaid(mapData, file.basename);

                const report = `\n## 🗺️ Architect View\n> **Phase:** ${mapData.myType}\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n`;
                editor.replaceSelection(report);
            }
        });

        // 2. COMMAND: Generate Global Dashboard (The Big Picture)
        this.addCommand({
            id: 'architect-global-dashboard',
            name: 'Generate Global Analytics Dashboard',
            callback: async () => {
                await this.generateGlobalDashboard();
            }
        });

        // Settings Tab
        this.addSettingTab(new ArchitectSettingTab(this.app, this));
    }

    // ==============================================================
    // LOCAL LOGIC: Analyze One File
    // ==============================================================
    async scanConnections(file: TFile) {
        const cache = this.app.metadataCache.getFileCache(file);
        const links = cache?.links || [];
        const nodes = [];

        // Determine current file type (Signal/Pattern/Constant)
        const frontmatter = cache?.frontmatter;
        let myType = this.settings.schema.level1; // Default to Signal

        if (frontmatter && frontmatter.type) {
            const t = frontmatter.type.toLowerCase();
            if (t === 'law' || t === 'constant') myType = this.settings.schema.level3;
            else if (t === 'molecule' || t === 'pattern') myType = this.settings.schema.level2;
            else if (t === 'atom' || t === 'signal') myType = this.settings.schema.level1;
            else myType = frontmatter.type;
        }

        // Analyze outgoing links
        for (const link of links) {
            nodes.push({
                name: link.link,
                displayText: link.displayText || link.link
            });
        }

        return { myType, nodes };
    }

    generateMermaid(data: any, centralName: string): string {
        let graph = "graph TD\n";

        // Apply Theophysics Styling
        graph += `    classDef signal fill:#e1f5fe,stroke:#01579b,stroke-width:2px;\n`;
        graph += `    classDef pattern fill:#e8f5e9,stroke:#1b5e20,stroke-width:4px;\n`;
        graph += `    classDef constant fill:#fff8e1,stroke:#ff6f00,stroke-width:6px;\n`;

        const centerClass = data.myType.toLowerCase();
        // Sanitize name for Mermaid (remove spaces/special chars)
        const safeCenter = centralName.replace(/[^a-zA-Z0-9]/g, '');

        graph += `    Center["${centralName}"]:::${centerClass}\n`;

        data.nodes.forEach((node: any, index: number) => {
            const safeNode = node.name.replace(/[^a-zA-Z0-9]/g, '');
            graph += `    Center --> Node${index}["${node.displayText}"]\n`;
        });

        return graph;
    }

    // ==============================================================
    // GLOBAL LOGIC: The "Data Analytics" Dashboard
    // ==============================================================
    async generateGlobalDashboard() {
        new Notice("Architect: Scanning entire vault...");

        const files = this.app.vault.getMarkdownFiles();

        const counts = {
            signals: 0,
            patterns: 0,
            constants: 0,
            breakthroughs: 0
        };

        const constantList: string[] = [];
        const patternList: string[] = [];

        // Crunch the data
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            const fm = cache?.frontmatter;

            if (!fm) continue;

            const type = (fm.type || "").toLowerCase();

            if (type === 'atom' || type === 'signal') counts.signals++;
            if (type === 'molecule' || type === 'pattern') {
                counts.patterns++;
                patternList.push(`- [[${file.basename}]]`);
            }
            if (type === 'law' || type === 'constant') {
                counts.constants++;
                constantList.push(`- [[${file.basename}]]`);
            }

            // Check for Breakthroughs
            if (cache.tags?.includes('#breakthrough') || fm.breakthrough === true) {
                counts.breakthroughs++;
            }
        }

        // Build the Dashboard Content
        let md = `---
cssclass: dashboard
tags: [dashboard, analytics]
updated: ${new Date().toLocaleString()}
---

<div class="architect-dashboard-header">
  <h1>🏛️ THEOPHYSICS ARCHITECT</h1>
  <p>Global Structure Analysis</p>
</div>

<div class="architect-stat-container">
  <div class="architect-stat-box">
    <div class="architect-stat-number">${counts.signals}</div>
    <div class="architect-stat-label">Signals</div>
  </div>
  <div class="architect-stat-box">
    <div class="architect-stat-number">${counts.patterns}</div>
    <div class="architect-stat-label">Patterns</div>
  </div>
  <div class="architect-stat-box">
    <div class="architect-stat-number">${counts.constants}</div>
    <div class="architect-stat-label">Constants</div>
  </div>
</div>

## 🚀 Breakthrough Velocity
**Total Breakthroughs:** ${counts.breakthroughs}

---

## 🌌 The Constants (Laws)
> *These are the bedrock truths.*
${constantList.join('\n') || "_No Constants defined yet._"}

---

## 🧬 The Patterns (Molecules)
> *Where Physics and Theology represent the same shape.*
${patternList.join('\n') || "_No Patterns defined yet._"}

---

## 🧠 Analytics Insights
`;

        // Add Logic: Are we balanced?
        const ratio = counts.signals / (counts.patterns || 1);
        if (ratio > 10) {
            md += `> [!WARNING] High Signal Noise\n> You have ${ratio.toFixed(1)} signals for every pattern. **Action:** Start synthesizing "Circling" ideas into "Reframed" Patterns.\n`;
        } else if (counts.constants === 0 && counts.patterns > 5) {
            md += `> [!TIP] Ready for Breakthrough\n> You have strong Patterns but no Constants. **Action:** Review your top Patterns to see which one is a Universal Law.\n`;
        } else {
            md += `> [!SUCCESS] Healthy Architecture\n> Good balance between raw signals and crystallized truth.\n`;
        }

        // SAVE THE FILE
        await this.saveToAnalysisFolder('ARCHITECT_ANALYTICS_DASHBOARD.md', md);
    }

    async saveToAnalysisFolder(filename: string, content: string) {
        // Ensure folder exists
        const folderPath = normalizePath(this.settings.analysisFolder);
        const folder = this.app.vault.getAbstractFileByPath(folderPath);

        if (!folder) {
            await this.app.vault.createFolder(folderPath);
        }

        const filePath = normalizePath(`${folderPath}/${filename}`);
        const file = this.app.vault.getAbstractFileByPath(filePath);

        if (file instanceof TFile) {
            await this.app.vault.modify(file, content);
            new Notice(`Updated: ${filePath}`);
        } else {
            await this.app.vault.create(filePath, content);
            new Notice(`Created: ${filePath}`);
        }

        // Open the dashboard
        const leaf = this.app.workspace.getLeaf(true);
        const targetFile = this.app.vault.getAbstractFileByPath(filePath);
        if (targetFile instanceof TFile) {
            leaf.openFile(targetFile);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

// === SETTINGS TAB ===
class ArchitectSettingTab extends PluginSettingTab {
    plugin: TheophysicsArchitect;

    constructor(app: App, plugin: TheophysicsArchitect) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Architect Settings' });

        new Setting(containerEl)
            .setName('Analytics Folder')
            .setDesc('Where should dashboards and reports be saved?')
            .addText(text => text
                .setPlaceholder('Data Analytics')
                .setValue(this.plugin.settings.analysisFolder)
                .onChange(async (value) => {
                    this.plugin.settings.analysisFolder = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'Naming Schema' });

        new Setting(containerEl)
            .setName('Level 1 Name')
            .setDesc('The basic unit (e.g., Atom, Signal)')
            .addText(text => text
                .setValue(this.plugin.settings.schema.level1)
                .onChange(async (value) => {
                    this.plugin.settings.schema.level1 = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Level 2 Name')
            .setDesc('The connection (e.g., Molecule, Pattern)')
            .addText(text => text
                .setValue(this.plugin.settings.schema.level2)
                .onChange(async (value) => {
                    this.plugin.settings.schema.level2 = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Level 3 Name')
            .setDesc('The truth (e.g., Law, Constant)')
            .addText(text => text
                .setValue(this.plugin.settings.schema.level3)
                .onChange(async (value) => {
                    this.plugin.settings.schema.level3 = value;
                    await this.plugin.saveSettings();
                }));
    }
}
