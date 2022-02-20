import * as vscode from 'vscode';

import { ResearchProvider } from './researchProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "research" is now active!');

	const researchProvider = new ResearchProvider(context);

	vscode.window.registerTreeDataProvider('researchView', researchProvider);

	let disposables = [
		vscode.commands.registerCommand('research.add', async () => {
			await researchProvider.add();
		}),

		vscode.commands.registerCommand('research.open', note => {
			researchProvider.open(note);
		}),

		vscode.commands.registerCommand('research.remove', note => {
			researchProvider.remove(note);
		}),

		vscode.commands.registerCommand('research.openAll', () => {
			researchProvider.openAll();
		}),

		vscode.commands.registerCommand('research.removeAll', () => {
			researchProvider.removeAll();
		})
	];

	context.subscriptions.push(...disposables);
}

export function deactivate() {}
