import { setup } from '../auto-generated'
import * as webpmClient from '@youwol/webpm-client'

import type * as FavoriteModule from './favorites'
import type * as WebpmPackageInfoModule from './webpm-package-info'
import type * as FileInfoModule from './file-info'
import type * as AboutYouwolModule from './about-youwol'
import type * as AssetViewModule from './assets'
import type { AssetLightDescription } from '@youwol/os-core'
import type { AssetsBackend } from '@youwol/http-clients'

export type * as WebpmPackageInfoTypes from './webpm-package-info'
export type * as FavoritesTypes from './favorites'
export type * as FileInfoTypes from './file-info'
export type * as AboutYouwolTypes from './about-youwol'
export type * as AssetTypes from './assets/asset-card'

export async function favoritesModule() {
    const module: typeof FavoriteModule = await setup.installAuxiliaryModule({
        name: 'favorites',
        cdnClient: webpmClient,
    })
    return module
}

export async function favoritesWidget(_fwdParams: unknown) {
    const module: typeof FavoriteModule = await setup.installAuxiliaryModule({
        name: 'favorites',
        cdnClient: webpmClient,
    })
    return new module.DesktopFavoritesView()
}

export async function webpmPackageInfoModule() {
    const module: typeof WebpmPackageInfoModule =
        await setup.installAuxiliaryModule({
            name: 'webpm-package-info',
            cdnClient: webpmClient,
        })
    return module
}

export async function webpmPackageInfoWidget({
    asset,
}: {
    asset: AssetLightDescription
}) {
    const module: typeof WebpmPackageInfoModule =
        await setup.installAuxiliaryModule({
            name: 'webpm-package-info',
            cdnClient: webpmClient,
        })
    return new module.PackageInfoView({ asset })
}

export async function fileInfoModule() {
    const module: typeof FileInfoModule = await setup.installAuxiliaryModule({
        name: 'file-info',
        cdnClient: webpmClient,
    })
    return module
}

export async function fileInfoWidget({
    asset,
    permissions,
}: {
    asset: AssetLightDescription
    permissions: AssetsBackend.GetPermissionsResponse
}) {
    const module: typeof FileInfoModule = await setup.installAuxiliaryModule({
        name: 'file-info',
        cdnClient: webpmClient,
    })
    return new module.FileInfoView({ asset, permissions })
}

export async function aboutYouwolModule() {
    const module: typeof AboutYouwolModule = await setup.installAuxiliaryModule(
        {
            name: 'about-youwol',
            cdnClient: webpmClient,
        },
    )
    return module
}

export async function aboutYouwolWidget({
    productName,
}: {
    productName: string
}) {
    const module: typeof AboutYouwolModule = await setup.installAuxiliaryModule(
        {
            name: 'about-youwol',
            cdnClient: webpmClient,
        },
    )
    return new module.AboutView({ productName })
}

export async function assetViewModule() {
    const module: typeof AssetViewModule = await setup.installAuxiliaryModule({
        name: 'assets',
        cdnClient: webpmClient,
    })
    return module
}
export async function assetsWidget({
    asset,
    permissions,
}: {
    asset: AssetsBackend.GetAssetResponse
    permissions: AssetsBackend.GetPermissionsResponse
}) {
    const module: typeof AssetViewModule = await setup.installAuxiliaryModule({
        name: 'assets',
        cdnClient: webpmClient,
    })
    return new module.AssetView({ asset, permissions })
}
