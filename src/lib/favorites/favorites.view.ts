import { child$, children$, Stream$, VirtualDOM } from '@youwol/flux-view'
import * as OsCore from '@youwol/os-core'
import { ExplorerBackend } from '@youwol/http-clients'
import { BehaviorSubject, combineLatest, from, Observable } from 'rxjs'
import { map, mergeMap, reduce } from 'rxjs/operators'
import { ApplicationInfo, FavoritesFacade } from '@youwol/os-core'
import { popupModal } from './common'
import * as cdnClient from '@youwol/cdn-client'
import { setup } from '../../auto-generated'
import type * as Marked from 'marked'

export class DesktopFavoritesView implements VirtualDOM {
    public readonly class =
        'd-flex w-50 flex-wrap  justify-content-center align-self-center '
    public readonly children: Stream$<
        [ExplorerBackend.GetItemResponse[], ApplicationInfo[]],
        VirtualDOM[]
    >

    constructor() {
        const appsInfo$ = OsCore.FavoritesFacade.getApplications$().pipe(
            mergeMap((apps) => {
                return from(apps).pipe(
                    mergeMap((app) =>
                        OsCore.RequestsExecutor.getApplicationInfo({
                            cdnPackage: window.atob(app.rawId),
                            version: 'latest',
                        }),
                    ),
                    reduce((acc: ApplicationInfo[], e) => [...acc, e], []),
                )
            }),
        )

        this.children = children$(
            combineLatest([OsCore.FavoritesFacade.getItems$(), appsInfo$]),
            ([items, apps]) => {
                return [
                    ...items.map((item) => {
                        return new DesktopFavoriteView({
                            item: item,
                        })
                    }),
                    ...apps.map((app: ApplicationInfo) => {
                        return new DesktopFavoriteView({ item: app })
                    }),
                ]
            },
        )
    }
}

export class DesktopFavoriteView implements VirtualDOM {
    public readonly class =
        'rounded p-1 d-flex flex-column align-items-center yw-hover-app m-1'
    public readonly style = {
        position: 'relative',
        width: '116px',
        height: '125px',
        overflowWrap: 'anywhere',
        textAlign: 'center',
        justifyContent: 'center',
    }
    public readonly item: ExplorerBackend.GetItemResponse | ApplicationInfo
    public readonly children: VirtualDOM[]
    public readonly hovered$ = new BehaviorSubject(false)
    public readonly ondblclick: () => void
    public readonly onmouseenter = () => {
        this.hovered$.next(true)
    }
    public readonly onmouseleave = () => {
        this.hovered$.next(false)
    }
    public readonly customAttributes: { dataToggle: string; title: string }

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
        Object.assign(this, params)
        this.children = [
            new DesktopIconView({ item: this.item }),

            new DesktopNameView({ item: this.item }),
            child$(this.hovered$, (isHovered) =>
                isHovered ? new SideAppActionsView({ item: this.item }) : {},
            ),
        ]
        this.customAttributes = {
            dataToggle: 'tooltip',
            title:
                'name' in params.item
                    ? params.item.name
                    : params.item.displayName,
        }
        this.ondblclick = () => {
            'name' in this.item
                ? OsCore.tryOpenWithDefault$(this.item).subscribe()
                : OsCore.ChildApplicationAPI.getOsInstance()
                      .createInstance$({
                          cdnPackage: this.item.cdnPackage,
                          parameters: {},
                          focus: true,
                          version: 'latest',
                      })
                      .subscribe()
        }
    }
}

class DesktopIconView implements VirtualDOM {
    public readonly class = 'd-flex justify-content-center align-items-center'
    public readonly style = {
        width: '75px',
        height: '75px',
    }
    public readonly children: VirtualDOM[]
    public readonly defaultOpeningApp$: Observable<{
        appInfo: OsCore.ApplicationInfo
    }>

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
        Object.assign(this, params)
        this.defaultOpeningApp$ =
            'name' in params.item
                ? OsCore.defaultOpeningApp$(params.item)
                : from([{ appInfo: params.item }])

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

class DesktopNameView implements VirtualDOM {
    public readonly class =
        'd-flex justify-content-center align-items-center mt-1'
    public readonly style = {
        height: '43px',
    }
    public readonly children: VirtualDOM[]

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
        Object.assign(this, params)
        this.children = [
            {
                style: {
                    height: '43px',
                },

                innerText:
                    'name' in params.item
                        ? params.item.name
                        : params.item.displayName,
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
    public readonly defaultOpeningApp$: Observable<{
        appInfo: OsCore.ApplicationInfo
    }>
    public readonly connectedCallback = (elem) => elem.stopPropagation

    public readonly children: VirtualDOM[]

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
        Object.assign(this, params)
        this.defaultOpeningApp$ =
            'name' in params.item
                ? OsCore.defaultOpeningApp$(params.item)
                : from([{ appInfo: params.item }])
        const assetId =
            'name' in params.item
                ? params.item.assetId
                : window.btoa(window.btoa(params.item.cdnPackage))
        this.children = [
            child$(OsCore.RequestsExecutor.getAsset(assetId), (asset) => {
                return asset.description
                    ? new SideAppInfoAction({
                          item: params.item,
                          text: asset.description,
                      })
                    : {}
            }),

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
                    return new SideAppRunAction({ item: params.item })
                },
            ),
            new SideAppRemoveAction({ item: params.item }),
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
    public readonly onclick: () => void

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
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
            'name' in params.item
                ? OsCore.tryOpenWithDefault$(params.item).subscribe()
                : OsCore.ChildApplicationAPI.getOsInstance()
                      .createInstance$({
                          cdnPackage: params.item.cdnPackage,
                          parameters: {},
                          focus: true,
                          version: 'latest',
                      })
                      .subscribe()
        }
    }
}

class SideAppInfoAction implements VirtualDOM {
    public readonly class = basedActionsClass
    public readonly style = basedActionsStyle
    public readonly children: VirtualDOM[]
    public readonly onclick: () => void

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
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
                        item: params.item,
                        text: params.text,
                    }),
            )
    }
}

class SideAppRemoveAction implements VirtualDOM {
    public readonly class = basedActionsClass

    public readonly style = basedActionsStyle
    public readonly children: VirtualDOM[]
    public readonly onclick: () => void

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
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
            popupModal(() => new ConfirmRemoveActionView({ item: params.item }))
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
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
        text: string
    }) {
        Object.assign(this, params)
        this.children = [
            new PopupHeaderView({
                title:
                    'name' in params.item
                        ? params.item.name
                        : params.item.displayName,
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

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
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
                            'name' in params.item
                                ? FavoritesFacade.toggleFavoriteItem(
                                      params.item.assetId,
                                  )
                                : FavoritesFacade.toggleFavoriteApplication(
                                      window.btoa(
                                          window.btoa(params.item.cdnPackage),
                                      ),
                                  )

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
