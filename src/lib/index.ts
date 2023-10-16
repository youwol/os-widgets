import { setup } from '../auto-generated'
import * as cdnClient from '@youwol/cdn-client'

import type * as FavoriteModule from './favorites'

export async function favoritesWidget(_fwdParams: unknown) {
    const module: typeof FavoriteModule = await setup.installAuxiliaryModule({
        name: 'favorites',
        cdnClient,
    })
    return new module.DesktopFavoritesView()
}
