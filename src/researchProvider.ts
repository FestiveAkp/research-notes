import * as vscode from 'vscode';

export class ResearchProvider implements vscode.TreeDataProvider<TreeResearchItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<TreeResearchItem | undefined | null | void> = 
        new vscode.EventEmitter<TreeResearchItem | undefined | null | void>();
    readonly onDidChangeTreeData?: vscode.Event<void | TreeResearchItem | null | undefined> | undefined =
        this._onDidChangeTreeData.event;

    // Notes are stored in memory for the time being
    temp: { name: string, link: string }[] = [];

	constructor(private context: vscode.ExtensionContext) {}

	getChildren(item?: TreeResearchItem | undefined): vscode.ProviderResult<TreeResearchItem[]> {
		if (item === undefined) {
            return this.temp.map(research => new TreeResearchItem(research.name, research.link));
		}

		return item.children;
	}

    getTreeItem(item: TreeResearchItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return item;
	}

    async add() {
        // Prompt user for the note's name
        const name = await vscode.window.showInputBox({
            placeHolder: "Give a title for this note, e.g. 'JavaScript reduce syntax'",
            ignoreFocusOut: true
        });

        if (name === undefined || name.trim() === '') {
            return; 
        }

        // Prompt user for the note's link
        const link = await vscode.window.showInputBox({ 
            placeHolder: "Enter URL of link to save, e.g. 'https://stackoverflow.com/questions/5508110/'",
            ignoreFocusOut: true
        });

        if (link === undefined || link.trim() === '') {
            return;
        }

        // Make sure this link is correctly formatted, otherwise don't store it
        // since we can't launch it with VS Code later
        try {
            vscode.Uri.parse(link, true);
        } catch (err) {
            vscode.window.showErrorMessage(`Error: URL scheme for '${link}' could not be correctly parsed. Make sure the URL starts with either http:// or https://.`);
            return;
        }

        // Persist new note and update the tree
        this.temp.push({ name, link });
        this._onDidChangeTreeData.fire(undefined);
        vscode.window.showInformationMessage(`Research - Added new research note '${name}'.`);
    }

    remove(note: TreeResearchItem) {
        // Remove note from storage
        this.temp = this.temp.filter(item => item.name !== note.label && item.link !== note.link);

        // Update the tree
        this._onDidChangeTreeData.fire(undefined);
        vscode.window.showInformationMessage(`Research - Removed research note '${note.label}'.`);
    }

    open(note: TreeResearchItem) {
        vscode.env.openExternal(vscode.Uri.parse(note.link));
    }

    openAll() {
        // Open every stored link
        this.temp.forEach(note => {
            vscode.env.openExternal(vscode.Uri.parse(note.link));
        });
    }

    removeAll() {
        // Remove all notes from storage
        this.temp = [];

        // Update the tree
        this._onDidChangeTreeData.fire(undefined);
        vscode.window.showInformationMessage('Research - Removed all notes.');
    }
}

class TreeResearchItem extends vscode.TreeItem {
	children: TreeResearchItem[] | undefined;
    link: string;

	constructor(label: string, link: string, children?: TreeResearchItem[]) {
		super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Expanded);
		this.children = children;
        this.link = link;
        this.iconPath = new vscode.ThemeIcon('link');
        this.contextValue = 'note';
        this.description = link;
	}
}

// https://code.visualstudio.com/api/extension-guides/tree-view#tree-view-api-basics
// https://medium.com/@sanaajani/creating-your-first-vs-code-extension-8dbdef2d6ad9
// https://code.visualstudio.com/api/references/icons-in-labels
// https://code.visualstudio.com/api/extension-guides/tree-view#tree-view-api-basics
