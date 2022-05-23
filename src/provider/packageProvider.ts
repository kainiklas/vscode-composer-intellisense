import * as vscode from 'vscode';
import axios from 'axios';
import * as types from '../types/types';

export async function getInstalledPackage(document: vscode.TextDocument, packageName: string): Promise<types.InstalledPackage> {
    const path = `${document.fileName.replace('composer.json', '')}vendor/composer/installed.json`;
    const uri = vscode.Uri.file(path);

    const fileContent = await vscode.workspace.fs.readFile(uri);
    const json = JSON.parse(fileContent.toString());
    const packages = json.packages || json;
    const pkg: types.InstalledPackage = packages.find((p: types.InstalledPackage) => p.name === packageName);

    return pkg;
};

export async function getPackageNames(query: string): Promise<types.Package[]> {
    let packages: types.Package[] = [];

    try {
        const { data } = await axios.get<types.PackageResponse>(
            'https://packagist.org/search.json?q=' + query,
            {
                headers: {
                    "Accept": 'application/json',
                    "User-Agent": 'vscode-composer-intellisense'
                }
            },
        );

        packages = data.results;
    } catch (error) {
        console.log(error);
    }

    return packages;
}