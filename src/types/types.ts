export type InstalledPackage = {
    name: string,
    source: {
        url: string
    },
    description: string,
    version: string,
    version_normalized: string
};

export type Package = {
    name: string,
    description: string,
    url: string,
    repository: string,
    downloads: number,
    favers: number,
};

export type PackageResponse = {
    results: Package[];
};

export type P2Package = {
    name: string,
    description: string,
    version: string,
    version_normalized: string,
    homepage: string,
    source: {
        url : string,
        type : string
    }
};