import * as vscode from 'vscode';
import { completionItemProvider } from "./autocomplete";
import { decorate, clearDecorations } from './decorator';

export function activate(context: vscode.ExtensionContext) {

	console.log("composer-intellisense activated");

	context.subscriptions.push(completionItemProvider);

	vscode.workspace.onDidOpenTextDocument(() => {
		const openEditor = vscode.window.visibleTextEditors.filter(
			editor => (editor.document.uri.path.endsWith('composer.json'))
		);

		if (openEditor.length) {
			decorate(openEditor[0]);
		}
	});

	vscode.workspace.onDidChangeTextDocument(() => {
		const openEditor = vscode.window.visibleTextEditors.filter(
			editor => (editor.document.uri.path.endsWith('composer.json'))
		);

		if (openEditor.length) {
			clearDecorations();
		}
	});

	vscode.workspace.onWillSaveTextDocument(() => {
		const openEditor = vscode.window.visibleTextEditors.filter(
			editor => (editor.document.uri.path.endsWith('composer.json'))
		);

		if (openEditor.length) {
			decorate(openEditor[0]);
		}
	});

}

export function deactivate() {
	clearDecorations();
}