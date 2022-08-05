import * as vscode from 'vscode';
import * as PackagistProvider from '../provider/packagistProvider';

const documentSelector = {
    scheme: 'file',
    language: 'json',
    pattern: '**/composer.json',
};

export const packageNamesCIP = vscode.languages.registerCompletionItemProvider(
    documentSelector,
    {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            // the range selects all including quotes
            const range = document.getWordRangeAtPosition(position, /"(.*?)"/);

            // remove the quotes
            const packageName = document.getText(range).replace(/^"|"$/g, '');

            if (packageName.length < 3) { return; }

            // check if selection is within require or require-dev
            const json = document.getText();
            const isInsideDependencies = new RegExp(`"(require|require-dev)":\\s*?\\{[^{}]*?"${packageName.replace(/\//g, '\\/')}"[^{}]*?\\}`, 'gm').test(json);
            if (!isInsideDependencies) { return; }

            let completionItems = getPackages(packageName, range);

            return completionItems;
        }
    }
);

async function getPackages(query: string, range: vscode.Range|undefined) {

    let completionItems: Array<vscode.CompletionItem> = [];
    
    let packages = await PackagistProvider.getPackageNames(query);

    packages.forEach((p) => {
        let item = new vscode.CompletionItem('"' + p.name + '"');
        item.detail = p.description;
        item.range = range;

        item.documentation = new vscode.MarkdownString()
            .appendMarkdown(`**Downloads:** ${p.downloads.toLocaleString()}` + "\n\n")
            .appendMarkdown(`**Favs:** ${p.favers.toLocaleString()}` + "\n\n")
            .appendMarkdown(`[Packagist](${p.url}) | [Repository](${p.repository})`);

        item.insertText = new vscode.SnippetString(`"${p.name}"`);

        completionItems.push(item);
    });

    return completionItems;
}