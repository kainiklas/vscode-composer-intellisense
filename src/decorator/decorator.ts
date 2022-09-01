import * as vscode from 'vscode';
import { getInstalledPackage } from '../provider/packageProvider';
import { getLatestPackage } from '../provider/packagistProvider';
import * as globals from '../util/globals';

export async function decorate(editor: vscode.TextEditor) {

    const NA = 'n/a';

    let sourceCode = editor.document.getText();
    let json = JSON.parse(sourceCode);

    let packageNames: string[] = [
        ...Object.keys(json['require']),
        ...Object.keys(json['require-dev'])
    ];

    let decorations: vscode.DecorationOptions[] = [];

    for (const packageName of packageNames) {
        let lines = getLines(editor.document, packageName);
        for (const line of lines) {

            let decorationText = '';

            let installedPackage = await getInstalledPackage(editor.document, packageName);
            let latestPackage = await getLatestPackage(packageName);

            let installedVersion = NA;
            let latestVersion = NA;

            if (installedPackage?.version_normalized) {
                const v = installedPackage?.version_normalized.split('.');
                installedVersion = `${v[0]}.${v[1]}.${v[2]}`;
            }

            if (latestPackage?.version_normalized) {
                const v = latestPackage?.version_normalized.split('.');
                latestVersion = `${v[0]}.${v[1]}.${v[2]}`;
            }

            if (installedVersion === latestVersion && installedVersion !== NA) {
                decorationText = installedVersion + ' (latest)';
            } else if (installedVersion === NA && latestVersion === NA) {
                decorationText = NA;
            }
            else {
                decorationText = installedVersion + " -> " + latestVersion;
            }

            decorations.push(decoration(decorationText, line));
        }
    };

    editor.setDecorations(globals.decorationType, decorations);
}

function getLines(document: vscode.TextDocument, packageName: string): number[] {

    let lineNumbers: number[] = [];
    let lineCount = document.lineCount;

    for (let lineNumber: number = 0; lineNumber < lineCount; lineNumber++) {
        let lineText = document.lineAt(lineNumber);
        let regex = '"' + packageName + '"';
        let matches = lineText.text.match(regex);
        if (matches) {
            lineNumbers.push(lineNumber);
            break;
        }
    }

    return lineNumbers;
}

const decoration = (text: string, line: number) => ({
    range: new vscode.Range(line, 1024, line, 1024),
    renderOptions: {
        after: {
            contentText: text,
            color: 'grey',
            margin: '0 0 0 1rem',
        },
    },
});

export function clearDecorations() {
    vscode.window.visibleTextEditors.forEach(textEditor => {
        textEditor.setDecorations(globals.decorationType, []);
    });
}