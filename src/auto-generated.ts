
const runTimeDependencies = {
    "externals": {
        "@youwol/os-core": "^0.2.0",
        "@youwol/webpm-client": "^3.0.0",
        "@youwol/http-clients": "^3.0.0",
        "@youwol/http-primitives": "^0.2.0",
        "@youwol/rx-vdom": "^1.0.1",
        "@youwol/rx-group-views": "^0.3.0",
        "@youwol/rx-tab-views": "^0.3.0",
        "@youwol/rx-input-views": "^0.3.0",
        "@youwol/rx-button-views": "^0.2.0",
        "@youwol/rx-context-menu-views": "^0.2.0",
        "@youwol/rx-tree-views": "^0.3.3",
        "rxjs": "^7.5.6",
        "lodash": "^4.17.15",
        "uuid": "^8.3.2",
        "marked": "^4.2.3"
    },
    "includedInBundle": {}
}
const externals = {
    "@youwol/os-core": {
        "commonjs": "@youwol/os-core",
        "commonjs2": "@youwol/os-core",
        "root": "@youwol/os-core_APIv02"
    },
    "@youwol/webpm-client": {
        "commonjs": "@youwol/webpm-client",
        "commonjs2": "@youwol/webpm-client",
        "root": "@youwol/webpm-client_APIv3"
    },
    "@youwol/http-clients": {
        "commonjs": "@youwol/http-clients",
        "commonjs2": "@youwol/http-clients",
        "root": "@youwol/http-clients_APIv3"
    },
    "@youwol/http-primitives": {
        "commonjs": "@youwol/http-primitives",
        "commonjs2": "@youwol/http-primitives",
        "root": "@youwol/http-primitives_APIv02"
    },
    "@youwol/rx-vdom": {
        "commonjs": "@youwol/rx-vdom",
        "commonjs2": "@youwol/rx-vdom",
        "root": "@youwol/rx-vdom_APIv1"
    },
    "@youwol/rx-group-views": {
        "commonjs": "@youwol/rx-group-views",
        "commonjs2": "@youwol/rx-group-views",
        "root": "@youwol/rx-group-views_APIv03"
    },
    "@youwol/rx-tab-views": {
        "commonjs": "@youwol/rx-tab-views",
        "commonjs2": "@youwol/rx-tab-views",
        "root": "@youwol/rx-tab-views_APIv03"
    },
    "@youwol/rx-input-views": {
        "commonjs": "@youwol/rx-input-views",
        "commonjs2": "@youwol/rx-input-views",
        "root": "@youwol/rx-input-views_APIv03"
    },
    "@youwol/rx-button-views": {
        "commonjs": "@youwol/rx-button-views",
        "commonjs2": "@youwol/rx-button-views",
        "root": "@youwol/rx-button-views_APIv02"
    },
    "@youwol/rx-context-menu-views": {
        "commonjs": "@youwol/rx-context-menu-views",
        "commonjs2": "@youwol/rx-context-menu-views",
        "root": "@youwol/rx-context-menu-views_APIv02"
    },
    "@youwol/rx-tree-views": {
        "commonjs": "@youwol/rx-tree-views",
        "commonjs2": "@youwol/rx-tree-views",
        "root": "@youwol/rx-tree-views_APIv03"
    },
    "rxjs": {
        "commonjs": "rxjs",
        "commonjs2": "rxjs",
        "root": "rxjs_APIv7"
    },
    "lodash": {
        "commonjs": "lodash",
        "commonjs2": "lodash",
        "root": "__APIv4"
    },
    "uuid": {
        "commonjs": "uuid",
        "commonjs2": "uuid",
        "root": "uuid_APIv8"
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
            "rxjs_APIv7",
            "operators"
        ]
    }
}
const exportedSymbols = {
    "@youwol/os-core": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/os-core"
    },
    "@youwol/webpm-client": {
        "apiKey": "3",
        "exportedSymbol": "@youwol/webpm-client"
    },
    "@youwol/http-clients": {
        "apiKey": "3",
        "exportedSymbol": "@youwol/http-clients"
    },
    "@youwol/http-primitives": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/http-primitives"
    },
    "@youwol/rx-vdom": {
        "apiKey": "1",
        "exportedSymbol": "@youwol/rx-vdom"
    },
    "@youwol/rx-group-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-group-views"
    },
    "@youwol/rx-tab-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-tab-views"
    },
    "@youwol/rx-input-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-input-views"
    },
    "@youwol/rx-button-views": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/rx-button-views"
    },
    "@youwol/rx-context-menu-views": {
        "apiKey": "02",
        "exportedSymbol": "@youwol/rx-context-menu-views"
    },
    "@youwol/rx-tree-views": {
        "apiKey": "03",
        "exportedSymbol": "@youwol/rx-tree-views"
    },
    "rxjs": {
        "apiKey": "7",
        "exportedSymbol": "rxjs"
    },
    "lodash": {
        "apiKey": "4",
        "exportedSymbol": "_"
    },
    "uuid": {
        "apiKey": "8",
        "exportedSymbol": "uuid"
    },
    "marked": {
        "apiKey": "4",
        "exportedSymbol": "marked"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./index.ts",
    "loadDependencies": [
        "@youwol/webpm-client"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {
    "favorites": {
        "entryFile": "./lib/favorites/index.ts",
        "loadDependencies": [
            "@youwol/webpm-client",
            "@youwol/rx-vdom",
            "rxjs",
            "@youwol/http-clients",
            "@youwol/os-core",
            "@youwol/rx-group-views"
        ],
        "name": "favorites"
    },
    "webpm-package-info": {
        "entryFile": "./lib/webpm-package-info/index.ts",
        "loadDependencies": [
            "@youwol/webpm-client",
            "@youwol/rx-vdom",
            "rxjs",
            "@youwol/http-clients",
            "@youwol/http-primitives",
            "@youwol/rx-input-views"
        ],
        "name": "webpm-package-info"
    },
    "file-info": {
        "entryFile": "./lib/file-info/index.ts",
        "loadDependencies": [
            "@youwol/rx-vdom",
            "rxjs",
            "@youwol/http-clients",
            "@youwol/http-primitives"
        ],
        "name": "file-info"
    },
    "about-youwol": {
        "entryFile": "./lib/about-youwol/index.ts",
        "loadDependencies": [
            "@youwol/rx-vdom",
            "rxjs"
        ],
        "name": "about-youwol"
    },
    "assets": {
        "entryFile": "./lib/assets/index.ts",
        "loadDependencies": [
            "@youwol/rx-vdom",
            "rxjs",
            "@youwol/rx-tab-views",
            "@youwol/rx-button-views",
            "@youwol/rx-input-views"
        ],
        "name": "assets"
    },
    "explorer": {
        "entryFile": "./lib/explorer/index.ts",
        "loadDependencies": [
            "@youwol/rx-vdom",
            "rxjs",
            "@youwol/rx-tab-views",
            "@youwol/rx-button-views",
            "@youwol/rx-input-views",
            "uuid",
            "lodash",
            "@youwol/rx-context-menu-views",
            "@youwol/rx-tree-views"
        ],
        "name": "explorer"
    }
}

const entries = {
     '@youwol/os-widgets': './index.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@youwol/os-widgets/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@youwol/os-widgets',
        assetId:'QHlvdXdvbC9vcy13aWRnZXRz',
    version:'0.2.7-wip',
    shortDescription:"Collection of widgets for the in-browser emulated OS of YouWol.",
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
            `@youwol/os-widgets#0.2.7-wip~dist/@youwol/os-widgets/${entry.name}.js`
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
