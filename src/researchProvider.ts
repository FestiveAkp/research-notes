import * as vscode from 'vscode';
import { nanoid } from 'nanoid';

export class ResearchProvider implements vscode.TreeDataProvider<TreeResearchItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<TreeResearchItem | undefined | null | void> = 
        new vscode.EventEmitter<TreeResearchItem | undefined | null | void>();
    readonly onDidChangeTreeData?: vscode.Event<void | TreeResearchItem | null | undefined> | undefined =
        this._onDidChangeTreeData.event;

	constructor(private context: vscode.ExtensionContext) {}

	getChildren(item?: TreeResearchItem | undefined): vscode.ProviderResult<TreeResearchItem[]> {
        console.log(this.context.workspaceState.get('notes'));

        if (item === undefined) {
            // Retrieve root nodes of the tree
            const notes: TreeResearchItem[] | undefined = this.context.workspaceState.get('notes');

            if (notes === undefined) {
                return [];
            }

            return notes.map(note => new TreeResearchItem(note.id, note.label, note.link));
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
        const notes: TreeResearchItem[] | undefined = this.context.workspaceState.get('notes');
        const note = new TreeResearchItem(nanoid(), name, link);

        if (notes === undefined) {
            this.context.workspaceState.update('notes', [note]);
        } else {
            this.context.workspaceState.update('notes', [...notes, note]);
        }

        this._onDidChangeTreeData.fire(undefined);
        vscode.window.showInformationMessage(`Research - Added new research note '${name}'.`);

        console.log(this.context.workspaceState.get('notes'));
    }

    remove(note: TreeResearchItem) {
        console.log('To remove: ', note);

        // Remove note from storage
        const notes: TreeResearchItem[] | undefined = this.context.workspaceState.get('notes');

        if (notes === undefined) {
            return;
        }

        // const filteredNotes = notes.filter(item => item.label !== note.label && item.link !== note.link);
        const filteredNotes = notes.filter(item => item.id !== note.id);
        this.context.workspaceState.update('notes', filteredNotes);

        // Update the tree
        this._onDidChangeTreeData.fire(undefined);
        vscode.window.showInformationMessage(`Research - Removed research note '${note.label}'.`);
    }

    open(note: TreeResearchItem) {
        vscode.env.openExternal(vscode.Uri.parse(note.link));
    }

    openAll() {
        // Open every stored link
        const notes: TreeResearchItem[] | undefined = this.context.workspaceState.get('notes');

        if (notes === undefined) {
            return;
        }

        notes.forEach(note => {
            const uri = vscode.Uri.parse(note.link);
            vscode.env.openExternal(uri);
        });
    }

    async copyAll() {
        // Retrieve every stored note
        const notes: TreeResearchItem[] | undefined = this.context.workspaceState.get('notes');

        if (notes === undefined) {
            return;
        }

        // Write JSON string to clipboard
        const output = notes.map(({label, description}) => ({ label, value: description }));
        await vscode.env.clipboard.writeText(JSON.stringify(output, null, 2));

        // Update the tree and let the user know
        this._onDidChangeTreeData.fire(undefined);
        vscode.window.showInformationMessage('Research - Copied all notes to clipboard.');
    }

    removeAll() {
        // Remove all notes from storage
        this.context.workspaceState.update('notes', []);

        // Update the tree
        this._onDidChangeTreeData.fire(undefined);
        vscode.window.showInformationMessage('Research - Removed all notes.');
    }
}

class TreeResearchItem extends vscode.TreeItem {
	children: TreeResearchItem[] | undefined;
    label: string;
    link: string;
    id: string;

	constructor(id: string, label: string, link: string, children?: TreeResearchItem[]) {
		super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Expanded);
        this.id = id;
		this.children = children;
        this.label = label;
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
