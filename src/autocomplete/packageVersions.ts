import * as vscode from 'vscode';
import * as PackagistProvider from '../provider/packagistProvider';
import * as globals from '../util/globals';

export const packageVersionsCIP = vscode.languages.registerCompletionItemProvider(
    globals.documentSelector,
    {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            // get package in line
            const matches = document.lineAt(position).text.match('"(.*?)"');
            if (!matches) { return; }
            const packageName = matches[1];

            // check if selection is within require or require-dev
            const json = document.getText();
            const isInsideDependencies = new RegExp(`"(require|require-dev)":\\s*?\\{[^{}]*?"${packageName.replace(/\//g, '\\/')}"[^{}]*?\\}`, 'gm').test(json);
            if (!isInsideDependencies) { return; }

            let completionItems: Array<vscode.CompletionItem> = new Array();
            let packageVersions = await PackagistProvider.getPackageVersions(packageName);

            packageVersions.forEach((v, i) => {
                const completionItem = new vscode.CompletionItem(v);
                completionItem.sortText = i.toString();
                completionItems.push(completionItem);
            });

            return completionItems;
        }
    }
);
