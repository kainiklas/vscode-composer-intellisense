import * as vscode from 'vscode';
import { getInstalledPackage } from '../provider/packageProvider';
import { documentSelector, InstalledPackage } from '../types/types';

export const packageHoverProvider = vscode.languages.registerHoverProvider(
    documentSelector,
    {
        async provideHover(document: vscode.TextDocument, position: vscode.Position) {
            // the range selects all including quotes
            const range = document.getWordRangeAtPosition(position);

            // remove the quotes
            const packageName = document.getText(range).replace(/^"|"$/g, '');

            if (packageName.length < 3) { return; }

            // check if selection is within require or require-dev
            const json = document.getText();
            const isInsideDependencies = new RegExp(`"(require|require-dev)":\\s*?\\{[^{}]*?"${packageName.replace(/\//g, '\\/')}"[^{}]*?\\}`, 'gm').test(json);
            if (!isInsideDependencies) { return; }

            const installedPackage = await getInstalledPackage(document, packageName);
            const markDown = getMarkdownString(installedPackage);
            return new vscode.Hover(markDown);
        }
    }
);

const getMarkdownString = function (pkg: InstalledPackage): vscode.MarkdownString {
    const sourceUrl = pkg.source.url;
    const sourceText = sourceUrl.includes('github.com') ? 'GitHub' : 'Source';
    const sourceHref = sourceUrl.replace(/\.git$/, '');

    return new vscode.MarkdownString()
        .appendMarkdown(pkg.description + "\n\n")
        .appendMarkdown(`Installed version: ${pkg.version}` + "\n\n")
        .appendMarkdown(`[Packagist](https://packagist.org/packages/${pkg.name})`)
        .appendText(' | ')
        .appendMarkdown(`[${sourceText}](${sourceHref})`);
};
