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
            const markDown = await getMarkdownString(installedPackage);
            return new vscode.Hover(markDown);
        }
    }
);

const getMarkdownString = async function (pkg: types.InstalledPackage): Promise<vscode.MarkdownString> {

    if (pkg === undefined) {
        return new vscode.MarkdownString('Not installed yet.');
    }

    const sourceUrl = pkg.source.url;
    const sourceText = sourceUrl.includes('github.com') ? 'GitHub' : 'Source';
    const sourceHref = sourceUrl.replace(/\.git$/, '');

    // get latest versions
    const versions = await PackagistProvider.getAllPackageVersions(pkg.name);
    const versionsMD = versions.slice(0, 5).map(i => "- " + i.replaceAll('"', '')).join(' \n\n');

    return new vscode.MarkdownString()
        .appendMarkdown(pkg.description + "\n\n")
        .appendMarkdown(`Installed version: ${pkg.version}` + "\n\n")
        .appendMarkdown(`[Packagist](https://packagist.org/packages/${pkg.name})`)
        .appendText(' | ')
        .appendMarkdown(`[${sourceText}](${sourceHref})` + "\n\n")
        .appendMarkdown(`Latest Versions:` + "\n\n")
        .appendMarkdown(versionsMD);
};
