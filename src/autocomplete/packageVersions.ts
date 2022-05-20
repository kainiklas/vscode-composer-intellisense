import * as vscode from 'vscode';
import axios from 'axios';
import { version } from 'os';

const documentSelector = {
    scheme: 'file',
    language: 'json',
    pattern: '**/composer.json',
};

export const packageVersionsCIP = vscode.languages.registerCompletionItemProvider(
    documentSelector,
    {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

            // get package in line
            const matches = document.lineAt(position).text.match('"(.*?)"');
            if (!matches) { return; }
            const packageName = matches[1];

            // check if selection is within require or require-dev
            const json = document.getText();
            const isInsideDependencies = new RegExp(`"(require|require-dev)":\\s*?\\{[^{}]*?"${packageName.replace(/\//g, '\\/')}"[^{}]*?\\}`, 'gm').test(json);
            if (!isInsideDependencies) { return; }

            let packageVersions = getPackageVersions(packageName);

            return packageVersions;
        }
    }
);

async function getPackageVersions(packageName: string) {

    type Package = {
        name: string,
        description: string,
        version: string,
        version_normalized: string,
    };

    type GetPackageResponse = {
        packages: [
            Package[]
        ];
    };

    let completionItems: Array<vscode.CompletionItem> = new Array();
    let versions: Set<string> = new Set();

    try {
        const { data } = await axios.get<GetPackageResponse>(
            'https://repo.packagist.org/p2/' + packageName + '.json',
            {
                headers: {
                    "Accept": 'application/json',
                    "User-Agent": 'vscode-composer-intellisense'
                }
            },
        );

        const entries = Object.entries(data.packages)[0][1];
        const maxEntries = Math.min(entries.length, 20);
        entries.slice(0, maxEntries).forEach((p) => {
            const v = p.version_normalized.split('.');
            versions.add(`"^${v[0]}.${v[1]}"`);
        });

        const versionsArray = Array.from(versions);

        versionsArray.forEach((v, i) => {
            const completionItem = new vscode.CompletionItem(v);
            completionItem.sortText = i.toString();
            completionItems.push(completionItem);
        });

    } catch (error) {
        console.error(error);
    }

    return Array.from(completionItems);
}