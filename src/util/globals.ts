import * as vscode from 'vscode';

export let extensionContext: vscode.ExtensionContext;


export const documentSelector = {
    scheme: 'file',
    language: 'json',
    pattern: '**/composer.json',
};

export const decorationType = vscode.window.createTextEditorDecorationType({
    color: 'grey',
});