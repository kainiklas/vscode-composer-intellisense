import * as vscode from 'vscode';

const decorationType = vscode.window.createTextEditorDecorationType({
    color: 'grey',
});

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
            let message = await getMessage(editor.document, packageName);
            decorations.push(decoration(message, line));
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

async function getMessage(document: vscode.TextDocument, packageName: string) {
    const path = `${document.fileName.replace('composer.json', '')}vendor/composer/installed.json`;
    const uri = vscode.Uri.file(path);

    const fileContent = await vscode.workspace.fs.readFile(uri);
    const json = JSON.parse(fileContent.toString());
    const packages = json.packages || json;
    const pkg = packages.find((p: any) => p.name === packageName);

    if (pkg) {
        return pkg.version;
    }

    return 'n/a';
}

export function clearDecorations() {
    vscode.window.visibleTextEditors.forEach(textEditor => {
        textEditor.setDecorations(decorationType, []);
    });
}