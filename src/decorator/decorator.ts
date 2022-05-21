import * as vscode from 'vscode';
import { getInstalledPackage } from '../provider/packageProvider';
import { decorationType } from '../types/types';

export async function decorate(editor: vscode.TextEditor) {
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
            let pkg = await getInstalledPackage(editor.document, packageName);
            decorations.push(decoration(pkg.version, line));
        }
    };

    editor.setDecorations(decorationType, decorations);
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
        textEditor.setDecorations(decorationType, []);
    });
}