
const runTimeDependencies = {
    "externals": {
        "@youwol/os-core": "^0.1.14",
        "@youwol/cdn-client": "^2.0.4",
        "@youwol/http-clients": "^2.0.5",
        "@youwol/http-primitives": "^0.1.2",
        "@youwol/flux-view": "^1.0.3",
        "@youwol/fv-group": "^0.2.3",
        "@youwol/fv-input": "^0.2.1",
        "rxjs": "^6.5.5",
        "marked": "^4.2.3"
    },
    "includedInBundle": {}
}
const externals = {
    "@youwol/os-core": {
        "commonjs": "@youwol/os-core",
        "commonjs2": "@youwol/os-core",
        "root": "@youwol/os-core_APIv01"
    },
    "@youwol/cdn-client": {
        "commonjs": "@youwol/cdn-client",
        "commonjs2": "@youwol/cdn-client",
        "root": "@youwol/cdn-client_APIv2"
    },
    "@youwol/http-clients": {
        "commonjs": "@youwol/http-clients",
        "commonjs2": "@youwol/http-clients",
        "root": "@youwol/http-clients_APIv2"
    },
    "@youwol/http-primitives": {
        "commonjs": "@youwol/http-primitives",
        "commonjs2": "@youwol/http-primitives",
        "root": "@youwol/http-primitives_APIv01"
    },
    "@youwol/flux-view": {
        "commonjs": "@youwol/flux-view",
        "commonjs2": "@youwol/flux-view",
        "root": "@youwol/flux-view_APIv1"
    },
    "@youwol/fv-group": {
        "commonjs": "@youwol/fv-group",
        "commonjs2": "@youwol/fv-group",
        "root": "@youwol/fv-group_APIv02"
    },
    "@youwol/fv-input": {
        "commonjs": "@youwol/fv-input",
        "commonjs2": "@youwol/fv-input",
        "root": "@youwol/fv-input_APIv02"
    },
    "rxjs": {
        "commonjs": "rxjs",
        "commonjs2": "rxjs",
        "root": "rxjs_APIv6"
    },
    "marked": {
        "commonjs": "marked",
        "commonjs2": "marked",
        "root": "marked_APIv4"
    },
    "rxjs/operators": {
        "commonjs": "rxjs/operators",
        "commonjs2": "rxjs/operators",
        "root": [
            "rxjs_APIv6",
            "operators"
        ]
    }
}
const exportedSymbols = {
    "@youwol/os-core": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/os-core"
    },
    "@youwol/cdn-client": {
        "apiKey": "2",
        "exportedSymbol": "@youwol/cdn-client"
    },
    "@youwol/http-clients": {
        "apiKey": "2",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/http-primitives": {
        "apiKey": "01",
        "exportedSymbol": "@youwol/http-primitives"
    },
    "@youwol/flux-view": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/flux-view"
    },
    "@youwol/fv-group": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-group"
    },
    "@youwol/fv-input": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/fv-input"
    },
    "rxjs": {
        "apiKey": "6",
        "exportedSymbol": "rxjs"
    },
    "marked": {
        "apiKey": "4",
        "exportedSymbol": "marked"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./index.ts",
    "loadDependencies": [
        "@youwol/cdn-client"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {
    "favorites": {
        "entryFile": "./lib/favorites/index.ts",
        "loadDependencies": [
            "@youwol/cdn-client",
            "@youwol/flux-view",
            "rxjs",
            "@youwol/http-clients",
            "@youwol/os-core",
            "@youwol/fv-group"
        ],
        "name": "favorites"
    },
    "webpm-package-info": {
        "entryFile": "./lib/webpm-package-info/index.ts",
        "loadDependencies": [
            "@youwol/cdn-client",
            "@youwol/flux-view",
            "rxjs",
            "@youwol/http-clients",
            "@youwol/http-primitives",
            "@youwol/fv-input"
        ],
        "name": "webpm-package-info"
    },
    "file-info": {
        "entryFile": "./lib/file-info/index.ts",
        "loadDependencies": [
            "@youwol/flux-view",
            "rxjs",
            "@youwol/http-clients",
            "@youwol/http-primitives"
        ],
        "name": "file-info"
    }
}

const entries = {
     '@youwol/os-widgets': './index.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/os-widgets/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/os-widgets',
        assetId:'QHlvdXdvbC9vcy13aWRnZXRz',
    version:'0.2.0-wip',
    shortDescription:"",
    developerDocumentation:'https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/os-widgets&tab=doc',
    npmPackage:'https://www.npmjs.com/package/@youwol/os-widgets',
    sourceGithub:'https://github.com/youwol/os-widgets',
    userGuide:'https://l.youwol.com/doc/@youwol/os-widgets',
    apiVersion:'02',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
    secondaryEntries,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    },

    installMainModule: ({cdnClient, installParameters}:{
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const parameters = installParameters || {}
        const scripts = parameters.scripts || []
        const modules = [
            ...(parameters.modules || []),
            ...mainEntry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/os-widgets_APIv02`]
        })
    },
    installAuxiliaryModule: ({name, cdnClient, installParameters}:{
        name: string,
        cdnClient:{install:(unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const entry = secondaryEntries[name]
        if(!entry){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const parameters = installParameters || {}
        const scripts = [
            ...(parameters.scripts || []),
            `@youwol/os-widgets#0.2.0-wip~dist/@youwol/os-widgets/${entry.name}.js`
        ]
        const modules = [
            ...(parameters.modules || []),
            ...entry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@youwol/os-widgets/${entry.name}_APIv02`]
        })
    },
    getCdnDependencies(name?: string){
        if(name && !secondaryEntries[name]){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const deps = name ? secondaryEntries[name].loadDependencies : mainEntry.loadDependencies

        return deps.map( d => `${d}#${runTimeDependencies.externals[d]}`)
    }
}
