import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AssetsBackend, AssetsGateway } from '@youwol/http-clients'
import { BehaviorSubject, from } from 'rxjs'
import { DockableTabs } from '@youwol/rx-tab-views'
import { map } from 'rxjs/operators'
import * as webpmClient from '@youwol/webpm-client'
import * as rxVdom from '@youwol/rx-vdom'
import { AssetOverview } from './overview/overview.view'
import { AssetPermissionsView } from './permissions/permissions.view'
import { defaultOpeningApp$, Installer } from '@youwol/os-core'

export class AssetView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'h-100 w-100'
    public readonly style = {
        position: 'relative' as const,
    }
    public readonly children: ChildrenLike
    public readonly asset: AssetsBackend.GetAssetResponse
    public readonly permissions: AssetsBackend.GetPermissionsResponse
    public readonly leftNavState: DockableTabs.State

    constructor(params: {
        asset: AssetsBackend.GetAssetResponse
        permissions: AssetsBackend.GetPermissionsResponse
    }) {
        Object.assign(this, params)
        const tabs$ = Installer.getInstallManifest$().pipe(
            map(({ assetPreviews }) => {
                return assetPreviews({
                    asset: this.asset,
                    permissions: this.permissions,
                    cdnClient: webpmClient,
                    fluxView: rxVdom,
                    assetsGtwClient: new AssetsGateway.Client(),
                }).filter((preview) => preview.applicable())
            }),
            map((previews) => {
                return [
                    new GeneralTab({
                        asset: this.asset,
                        permissions: this.permissions,
                    }),
                    new PermissionsTab({
                        asset: this.asset,
                        permissions: this.permissions,
                    }),
                    ...previews.map(
                        (preview) =>
                            new CustomTab({
                                asset: this.asset,
                                preview: preview.exe(),
                                name: preview.name,
                                icon: preview.icon,
                            }),
                    ),
                ]
            }),
        )
        this.leftNavState = new DockableTabs.State({
            disposition: 'top',
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>('pined'),
            tabs$,
            selected$: new BehaviorSubject('Overview'),
            persistTabsView: false,
        })
        const sideNav = new DockableTabs.View({
            state: this.leftNavState,
            styleOptions: {
                initialPanelSize: '400px',
                wrapper: {
                    class: 'h-100 fv-bg-primary',
                },
            },
        })
        this.children = [sideNav]
    }
}

function getBackgroundChild$(asset: AssetsBackend.GetAssetResponse) {
    return {
        source$: defaultOpeningApp$(asset),
        vdomMap: (info): VirtualDOM<'div'> => {
            return info?.appInfo?.graphics?.background
                ? {
                      tag: 'div',
                      class: 'w-100 h-100',
                      style: {
                          position: 'absolute',
                          zIndex: -1,
                      },
                      children: [info.appInfo.graphics.background],
                  }
                : { tag: 'div' }
        },
    }
}

export class GeneralTab extends DockableTabs.Tab {
    constructor(params: {
        asset: AssetsBackend.GetAssetResponse
        permissions: AssetsBackend.GetPermissionsResponse
    }) {
        super({
            id: 'Overview',
            title: 'Overview',
            icon: 'fas fa-home',
            content: () => {
                return {
                    tag: 'div',
                    class: 'w-100 h-100 fv-bg-background fv-xx-lighter',
                    style: {
                        position: 'relative',
                    },
                    children: [
                        getBackgroundChild$(params.asset),
                        new AssetOverview({
                            asset: params.asset,
                            permissions: params.permissions,
                            actionsFactory: undefined,
                        }),
                    ],
                }
            },
        })
        Object.assign(this, params)
    }
}

export class PermissionsTab extends DockableTabs.Tab {
    constructor(params: {
        asset: AssetsBackend.GetAssetResponse
        permissions: AssetsBackend.GetPermissionsResponse
    }) {
        super({
            id: 'Permissions',
            title: 'Permissions',
            icon: 'fas fa-lock',
            content: () => {
                return {
                    tag: 'div',
                    class: 'w-100 h-100 fv-bg-background fv-xx-lighter',
                    style: {
                        position: 'relative' as const,
                    },
                    children: [
                        getBackgroundChild$(params.asset),
                        new AssetPermissionsView({
                            asset: params.asset,
                            permissions: params.permissions,
                        }),
                    ],
                }
            },
        })
        Object.assign(this, params)
    }
}

export class CustomTab extends DockableTabs.Tab {
    constructor(params: {
        asset: AssetsBackend.GetAssetResponse
        name: string
        preview: AnyVirtualDOM | Promise<AnyVirtualDOM>
        icon: string
    }) {
        super({
            id: params.name,
            title: params.name,
            icon: params.icon,
            content: () => {
                if (params.preview instanceof Promise) {
                    return {
                        tag: 'div',
                        children: [
                            {
                                source$: from(params.preview),
                                vdomMap: (view: AnyVirtualDOM) => view,
                            },
                        ],
                    }
                }
                return params.preview as VirtualDOM<'div'>
            },
        })
        Object.assign(this, params)
    }
}
