import * as vscode from 'vscode';
import { getInstalledPackage } from '../provider/packageProvider';
import * as types from '../types/types';
import * as globals from '../util/globals';
import * as PackagistProvider from '../provider/packagistProvider';

export const packageHoverProvider = vscode.languages.registerHoverProvider(
    globals.documentSelector,
    {
        async provideHover(document: vscode.TextDocument, position: vscode.Position) {
            // the range selects all including quotes
            const range = document.getWordRangeAtPosition(position, /"(.*?)"/);

            // remove the quotes
            const packageName = document.getText(range).replace(/^"|"$/g, '');

            if (packageName.length < 3) { return; }

            // check if selection is within require or require-dev
            const json = document.getText();
            const isInsideDependencies = new RegExp(`"(require|require-dev)":\\s*?\\{[^{}]*?"${packageName.replace(/\//g, '\\/')}"[^{}]*?\\}`, 'gm').test(json);
            if (!isInsideDependencies) { return; }

            const installedPackage = await getInstalledPackage(document, packageName);
            const latestPackage = await PackagistProvider.getLatestPackage(packageName);
            const markDown = await getMarkdownStringNew(latestPackage, installedPackage);

            return new vscode.Hover(markDown);
        }
    }
);

const getMarkdownStringNew = async function (latestPackage: types.P2Package, installedPackage: types.InstalledPackage): Promise<vscode.MarkdownString> {

    let installedVersion = "n/a";
    if (installedPackage !== undefined) {
       installedVersion = installedPackage.version;
    }
    
    return new vscode.MarkdownString()
        .appendMarkdown("**" + latestPackage.name + "** \n\n")
        .appendMarkdown(latestPackage.description + "\n\n")
        .appendMarkdown(`Latest version: ${latestPackage.version}` + "\n\n")
        .appendMarkdown(`Installed version: ${installedVersion}` + "\n\n")
        .appendMarkdown(`[Packagist](https://packagist.org/packages/${latestPackage.name})`)
        .appendText(' | ')
        .appendMarkdown(`[${latestPackage.source.type}](${latestPackage.source.url})` + "\n\n");
};