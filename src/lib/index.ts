import { setup } from '../auto-generated'
import * as cdnClient from '@youwol/cdn-client'

import type * as FavoriteModule from './favorites'
import type * as WebpmPackageInfoModule from './webpm-package-info'
import type * as FileInfoModule from './file-info'
import type { AssetLightDescription } from '@youwol/os-core'
import type { AssetsBackend } from '@youwol/http-clients'

export async function favoritesWidget(_fwdParams: unknown) {
    const module: typeof FavoriteModule = await setup.installAuxiliaryModule({
        name: 'favorites',
        cdnClient,
    })
    return new module.DesktopFavoritesView()
}

export async function webpmPackageInfoWidget({
    asset,
}: {
    asset: AssetLightDescription
}) {
    const module: typeof WebpmPackageInfoModule =
        await setup.installAuxiliaryModule({
            name: 'webpm-package-info',
            cdnClient,
        })
    return new module.PackageInfoView({ asset })
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
        cdnClient,
    })
    return new module.FileInfoView({ asset, permissions })
}
