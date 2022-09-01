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

export async function getLatestPackage(packageName: string): Promise<types.P2Package> {

    const entries = await getPackageEntries(packageName);
    return entries[0];
}

export async function getAllPackageVersions(packageName: string): Promise<string[]> {

    let versions: Array<string> = [];

    const entries = await getPackageEntries(packageName);
    const maxEntries = Math.min(entries.length, 40);

    entries.slice(0, maxEntries).forEach((p) => {
        versions.push(p.version_normalized);
    });

    return versions;
}


/**
 * Executes the webservice call to packagist
 * https://repo.packagist.org/p2/[vendor]/[package].json
 *
 * @param packageName 
 * @returns array of P2Packages from packagist
 */
async function getPackageEntries(packageName: string): Promise<types.P2Package[]> {

    type GetPackageResponse = {
        packages: [
            types.P2Package[]
        ];
    };

    let cache = new CACHE(globals.extensionContext, 'p2packages');

    // return the cached item
    if (cache.has(packageName)) {
        return cache.get(packageName);
    }

    let entries: types.P2Package[] = [];

    try {
        const { data } = await axios.get<GetPackageResponse>(
            'https://repo.packagist.org/p2/' + packageName + '.json',
            {
                headers: headers
            },
        );

        entries = Object.entries(data.packages)[0][1];

    } catch (error) {
        console.error(error);
    } finally {
        // cache the versions
        let cacheTimeout = vscode.workspace.getConfiguration('composerIntellisense').get('packagistCache');
        cache.put(packageName, entries, cacheTimeout);
    }

    return entries;
}

/**
 * /**
 * Executes the webservice call to packagist
 * https://packagist.org/search.json?q=[query]
 *
 * @param query (the package name)
 * @returns array of packages
 */
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