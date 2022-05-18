import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {

	let documentSelector = {
		scheme: 'file',
		language: 'json',
		pattern: '**/composer.json',
	};

	let autocompletion = vscode.languages.registerCompletionItemProvider(
		documentSelector,
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

				// the range selects all including quotes
				const range = document.getWordRangeAtPosition(position);

				// remove the quotes
				const packageName = document.getText(range).replace(/^"|"$/g, '');

				// check if selection is within require or require-dev
				const json = document.getText();
				const isInsideDependencies = new RegExp(`"(require|require-dev)":\\s*?\\{[^{}]*?"${packageName.replace(/\//g, '\\/')}"[^{}]*?\\}`, 'gm').test(json);
				if (!isInsideDependencies) { return; }

				let completionItems = getPackages(packageName);

				return completionItems;
			}
		}
	);

	context.subscriptions.push(autocompletion);

}

export function deactivate() { }

async function getPackages(query: string) {

	type Package = {
		name: string,
		description: string,
		url: string,
		repository: string,
		downloads: number,
		favers: number,
	};

	type GetPackageResponse = {
		results: Package[];
	};

	let completionItems: Array<vscode.CompletionItem> = [];

	try {
		const { data } = await axios.get<GetPackageResponse>(
			'https://packagist.org/search.json?q=' + query,
			{
				headers: {
					"Accept": 'application/json',
					"User-Agent": 'vscode-composer-intellisense'
				}
			},
		);

		data.results.forEach((p) => {
			let item = new vscode.CompletionItem('"' + p.name + '"');
			item.detail = p.description;

			item.documentation = new vscode.MarkdownString()
				.appendMarkdown(`**Downloads:** ${p.downloads}` + "\n\n")
				.appendMarkdown(`**Favs:** ${p.favers}` + "\n\n")
				.appendMarkdown(`[Packagist](${p.url}) | [Repository](${p.repository})`);

			completionItems.push(item);
		});

	} catch (error) {
		console.error(error);
	}

	return completionItems;
}