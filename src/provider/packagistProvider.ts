import axios from 'axios';
import * as vscode from 'vscode';
import * as types from '../types/types';
import * as globals from '../util/globals';
const CACHE = require('vscode-cache');

const headers = {
    "Accept": 'application/json',
    "User-Agent": 'vscode-composer-intellisense | kai.niklas@web.de'
};

export async function getPackageVersions(packageName: string): Promise<string[]> {

    let versionsArray: Array<string> = new Array();
    let versions: Set<string> = new Set();

    let allVersions = await getAllPackageVersions(packageName);

    // transform versions to oppinionated format
    allVersions.forEach((version) => {
        const v = version.split('.');
        versions.add(`"^${v[0]}.${v[1]}"`);
    });

    versionsArray = Array.from(versions);

    return versionsArray;
}

export async function getAllPackageVersions(packageName: string): Promise<string[]> {
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

    let versions: Array<string> = new Array();

    let cache = new CACHE(globals.extensionContext, 'versions');

    // return the cached item
    if (cache.has(packageName)) {
        return cache.get(packageName);
    }

    try {
        const { data } = await axios.get<GetPackageResponse>(
            'https://repo.packagist.org/p2/' + packageName + '.json',
            {
                headers: headers
            },
        );

        const entries = Object.entries(data.packages)[0][1];
        const maxEntries = Math.min(entries.length, 20);
        entries.slice(0, maxEntries).forEach((p) => {
            versions.push(p.version_normalized);
        });

        // cache the versions for 1h
        let cacheTimeout = vscode.workspace.getConfiguration('composerIntellisense').get('packagistCache');
        cache.put(packageName, versions, cacheTimeout);

    } catch (error) {
        console.error(error);
    }

    return versions;
}

export async function getPackageNames(query: string): Promise<types.Package[]> {
    let packages: types.Package[] = [];

    try {
        const { data } = await axios.get<types.PackageResponse>(
            'https://packagist.org/search.json?q=' + query,
            {
                headers: headers
            },
        );

        packages = data.results;
    } catch (error) {
        console.log(error);
    }

    return packages;
}