import * as vscode from 'vscode';
import * as types from '../types/types';

export async function getInstalledPackage(document: vscode.TextDocument, packageName: string): Promise<types.InstalledPackage> {
    const path = `${document.fileName.replace('composer.json', '')}vendor/composer/installed.json`;
    const uri = vscode.Uri.file(path);

    let pkg;

    try {
        const fileContent = await vscode.workspace.fs.readFile(uri);
        const json = JSON.parse(fileContent.toString());
        const packages = json.packages || json;
        pkg = packages.find((p: types.InstalledPackage) => p.name === packageName);
    } catch(error) {
        // file not found
    }

    return pkg;
};