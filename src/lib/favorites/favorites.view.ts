import { child$, Stream$, VirtualDOM, children$ } from '@youwol/flux-view'
import * as OsCore from '@youwol/os-core'
import { AssetsBackend, ExplorerBackend } from '@youwol/http-clients'
import { BehaviorSubject, from, Observable } from 'rxjs'
import { popupModal } from './common'
import * as cdnClient from '@youwol/cdn-client'
import { setup } from '../../auto-generated'
import type * as Marked from 'marked'
import { map } from 'rxjs/operators'

export class DesktopFavoritesView implements VirtualDOM {
    public readonly class =
        'd-flex w-50 flex-wrap  justify-content-center align-self-center '
    public readonly children: Stream$<
        ExplorerBackend.GetItemResponse[],
        VirtualDOM
    >

    constructor() {
        this.children = children$(
            OsCore.FavoritesFacade.getItems$(),
            (items) => {
                return items.map((item) => {
                    return new DesktopFavoriteView({
                        item,
                    })
                })
            },
        )
    }
}

export class DesktopFavoriteView implements VirtualDOM {
    public readonly class =
        'rounded z-1 p-1 d-flex flex-column align-items-center yw-hover-app m-1'
    public readonly style = {
        position: 'relative',
        width: '116px',
        height: '125px',
        overflowWrap: 'anywhere',
        textAlign: 'center',
        justifyContent: 'center',
    }
    public readonly item: ExplorerBackend.GetItemResponse
    public readonly children: VirtualDOM[]
    public readonly hovered$ = new BehaviorSubject(false)

    public readonly ondblclick = () => {
        OsCore.tryOpenWithDefault$(this.item).subscribe()
    }
    public readonly onmouseenter = () => {
        this.hovered$.next(true)
    }
    public readonly onmouseleave = () => {
        this.hovered$.next(false)
    }
    public readonly customAttributes: { dataToggle: string; title: string }

    constructor(params: { item: ExplorerBackend.GetItemResponse }) {
        Object.assign(this, params)
        this.children = [
            new DesktopAppIconView({ item: this.item }),

            new DesktopAppNameView({ item: this.item }),
            child$(this.hovered$, (isHovered) =>
                isHovered ? new SideAppActionsView({ item: this.item }) : {},
            ),
        ]
        this.customAttributes = {
            dataToggle: 'tooltip',
            title: this.item.name,
        }
    }
}

class DesktopAppIconView implements VirtualDOM {
    public readonly class = 'd-flex justify-content-center align-items-center'
    public readonly style = {
        width: '75px',
        height: '75px',
    }
    public readonly children: VirtualDOM[]
    public readonly item: ExplorerBackend.GetItemResponse

    public readonly defaultOpeningApp$: Observable<{
        appInfo: OsCore.ApplicationInfo
    }>

    constructor(params: { item: ExplorerBackend.GetItemResponse }) {
        Object.assign(this, params)

        this.defaultOpeningApp$ = OsCore.defaultOpeningApp$(this.item)

        this.children = [
            child$(
                this.defaultOpeningApp$,
                (
                    defaultResp:
                        | { appInfo: OsCore.ApplicationInfo }
                        | undefined,
                ) => {
                    if (!defaultResp) {
                        return { class: 'fas fa-file fa-3x' }
                    }
                    return defaultResp.appInfo.graphics.appIcon
                },
                {
                    untilFirst: {
                        class: 'd-flex align-items-center position-relative',
                        children: [
                            { class: 'fas fa-file fa-3x' },
                            {
                                class: 'fas fa-spinner w-100 fa-spin fv-text-secondary text-center position-absolute',
                            },
                        ],
                    },
                },
            ),
        ]
    }
}

class DesktopAppNameView implements VirtualDOM {
    public readonly class = 'd-flex justify-content-center align-items-center'
    public readonly style = {
        height: '43px',
    }
    public readonly children: VirtualDOM[]
    public readonly item: ExplorerBackend.GetItemResponse

    constructor(params: { item: ExplorerBackend.GetItemResponse }) {
        Object.assign(this, params)
        this.children = [
            {
                style: {
                    height: '43px',
                },

                innerText: this.item.name,
            },
        ]
    }
}

class SideAppActionsView implements VirtualDOM {
    public readonly class = 'd-flex flex-column' //: Stream$<boolean, string>
    public readonly style = {
        position: 'absolute',
        top: '5px',
        right: '5%',
    }

    public readonly item: ExplorerBackend.GetItemResponse
    public readonly defaultOpeningApp$: Observable<{
        appInfo: OsCore.ApplicationInfo
    }>
    public readonly connectedCallback = (elem) => elem.stopPropagation

    public readonly children: VirtualDOM[]

    constructor(params: { item: ExplorerBackend.GetItemResponse }) {
        Object.assign(this, params)
        this.defaultOpeningApp$ = OsCore.defaultOpeningApp$(this.item)
        this.children = [
            child$(
                OsCore.RequestsExecutor.getAsset(this.item.assetId),
                (asset) => {
                    return asset.description
                        ? new SideAppInfoAction({
                              item: params.item,
                              text: asset.description,
                          })
                        : {}
                },
            ),

            child$(
                this.defaultOpeningApp$,
                (
                    defaultResp:
                        | { appInfo: OsCore.ApplicationInfo }
                        | undefined,
                ) => {
                    if (!defaultResp) {
                        return {}
                    }
                    return new SideAppRunAction({ item: this.item })
                },
            ),
            new SideAppRemoveAction({ item: this.item }),
        ]
    }
}

const basedActionsClass =
    'rounded d-flex justify-content-center align-items-center'
const basedActionsStyle = {
    width: '15px',
    height: '15px',
    marginTop: '3px',
}

const iconsClasses = 'fas  fa-xs yw-hover-text-orange fv-pointer'
class SideAppRunAction implements VirtualDOM {
    public readonly class = basedActionsClass

    public readonly style = basedActionsStyle
    public readonly children: VirtualDOM[]
    public readonly item: ExplorerBackend.GetItemResponse

    public readonly onclick: () => void

    constructor(params: { item: ExplorerBackend.GetItemResponse }) {
        Object.assign(this, params)
        this.children = [
            {
                class: `fa-play ${iconsClasses}`,
                customAttributes: {
                    dataToggle: 'tooltip',
                    title: 'Run',
                },
            },
        ]
        this.onclick = () => {
            OsCore.tryOpenWithDefault$(this.item).subscribe()
        }
    }
}

class SideAppInfoAction implements VirtualDOM {
    public readonly class = basedActionsClass

    public readonly style = basedActionsStyle
    public readonly children: VirtualDOM[]
    public readonly item: ExplorerBackend.GetItemResponse
    // public readonly asset: ExplorerBackend.GetItemResponse

    public readonly onclick: () => void
    public readonly asset: AssetsBackend.GetAssetResponse

    constructor(params: {
        item: ExplorerBackend.GetItemResponse
        text: string
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: `fa-info ${iconsClasses}`,
                customAttributes: {
                    dataToggle: 'tooltip',
                    title: 'More information',
                },
            },
        ]
        this.onclick = () =>
            popupModal(
                () =>
                    new AppDescriptionView({
                        item: this.item,
                        text: params.text,
                    }),
            )
    }
}

class SideAppRemoveAction implements VirtualDOM {
    public readonly class = basedActionsClass

    public readonly style = basedActionsStyle
    public readonly children: VirtualDOM[]
    public readonly item: ExplorerBackend.GetItemResponse

    public readonly onclick: () => void

    constructor(params: { item: ExplorerBackend.GetItemResponse }) {
        Object.assign(this, params)
        this.children = [
            {
                class: `fa-times-circle ${iconsClasses}`,
                customAttributes: {
                    dataToggle: 'tooltip',
                    title: 'Remove from desktop',
                },
            },
        ]
        this.onclick = () =>
            popupModal(() => new ConfirmRemoveActionView({ item: this.item }))
    }
}

function installMarked$() {
    return from(
        cdnClient.install({
            modules: [`marked#${setup.runTimeDependencies.externals.marked}`],
        }) as unknown as Promise<{ marked: typeof Marked }>,
    ).pipe(map(({ marked }) => marked))
}

class AppDescriptionView implements VirtualDOM {
    public readonly class =
        'vw-50 vh-50 rounded mx-auto my-auto p-4 yw-bg-dark  yw-box-shadow yw-animate-in '
    public readonly children: VirtualDOM[]

    constructor(params: {
        item: ExplorerBackend.GetItemResponse
        text: string
    }) {
        Object.assign(this, params)
        this.children = [
            new PopupHeaderView({
                title: params.item.name,
                fa: 'info',
            }),
            child$(installMarked$(), (markedModule) => ({
                class: 'fv-text-primary mt-4 mb-4 text-start overflow-auto',
                style: {
                    width: '50vh',
                    maxHeight: '50vh',
                },
                innerHTML: markedModule.parse(params.text),
            })),
            {
                class: 'd-flex  fv-text-primary yw-hover-text-dark justify-content-center',
                children: [new CanclePopupButtonView()],
            },

            new ClosePopupButtonView(),
        ]
    }
}

class ConfirmRemoveActionView implements VirtualDOM {
    public readonly class =
        'w-100 rounded mx-auto my-auto p-4 yw-bg-dark  yw-box-shadow yw-animate-in'

    public readonly children: VirtualDOM[]
    public readonly item: ExplorerBackend.GetItemResponse

    constructor(params: { item: ExplorerBackend.GetItemResponse }) {
        Object.assign(this, params)
        this.children = [
            new PopupHeaderView({
                title: 'Remove item',
                fa: 'times-circle',
            }),
            {
                class: 'fv-text-primary mt-4 mb-4 text-center',
                innerText: 'Remove from desktop?',
            },

            {
                class: 'd-flex  fv-text-primary yw-hover-text-dark justify-content-between',
                children: [
                    new CanclePopupButtonView(),
                    {
                        class: 'btn ms-3 yw-text-light-orange  yw-border-orange yw-hover-bg-light-orange rounded yw-hover-text-dark yw-text-orange  fv-bg-background',
                        style: {
                            width: '100px',
                        },
                        innerText: 'Remove',
                        onclick: () => {
                            OsCore.FavoritesFacade.remove(this.item.itemId)
                            closeWithoutAction()
                        },
                    },
                ],
            },

            new ClosePopupButtonView(),
        ]
    }
}

export class PopupHeaderView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag: string = 'i'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: string
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor({ title, fa }: { title: string; fa: string }) {
        this.children = [
            {
                style: {
                    fontSize: '16px',
                },
                class: 'ms-3 fv-font-family-regular',
                innerHTML: title,
            },
        ]
        this.class = `fas fa-${fa} d-flex fa-lg fv-text-primary `
    }
}

export class CanclePopupButtonView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'btn me-3 yw-text-light-orange  yw-border-orange yw-hover-bg-light-orange rounded yw-hover-text-dark yw-text-orange  fv-bg-background'

    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'span'
    /**
     * @group Immutable DOM Constants
     */
    public readonly innerText = 'Cancel'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        color: 'unset',
        width: '100px',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick = () => closeWithoutAction()
}

export class ClosePopupButtonView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'fas fa-times  fv-pointer yw-text-orange'
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'span'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        position: 'absolute',
        top: '10px',
        right: '10px',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick = () => closeWithoutAction()
}

const closeWithoutAction = () =>
    document.querySelector('body > div:nth-child(2)').remove()
