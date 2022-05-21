import * as vscode from 'vscode';

export const documentSelector = {
    scheme: 'file',
    language: 'json',
    pattern: '**/composer.json',
};

export type InstalledPackage = {
    name: string,
    source: {
        url: string
    },
    description: string,
    version: string
};

export const decorationType = vscode.window.createTextEditorDecorationType({
    color: 'grey',
});