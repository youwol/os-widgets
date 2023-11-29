import { VirtualDOM, ChildrenLike } from '@youwol/rx-vdom'
import * as OsCore from '@youwol/os-core'
import { AssetsBackend, ExplorerBackend } from '@youwol/http-clients'
import { BehaviorSubject, combineLatest, from, Observable } from 'rxjs'
import { map, mergeMap, reduce } from 'rxjs/operators'
import { ApplicationInfo, FavoritesFacade } from '@youwol/os-core'
import { popupModal } from './common'
import { setup } from '../../auto-generated'
import type * as Marked from 'marked'

export class DesktopFavoritesView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'd-flex w-50 flex-wrap  justify-content-center align-self-center '
    public readonly children: ChildrenLike

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

        this.children = {
            policy: 'replace',
            source$: combineLatest([
                OsCore.FavoritesFacade.getItems$(),
                appsInfo$,
            ]),
            vdomMap: ([items, apps]) => {
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
        }
    }
}

export class DesktopFavoriteView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'rounded p-1 d-flex flex-column align-items-center yw-hover-app m-1'
    public readonly style = {
        position: 'relative' as const,
        width: '116px',
        height: '125px',
        overflowWrap: 'anywhere' as const,
        textAlign: 'center' as const,
        justifyContent: 'center' as const,
    }
    public readonly item: ExplorerBackend.GetItemResponse | ApplicationInfo
    public readonly children: ChildrenLike
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
            {
                source$: this.hovered$,
                vdomMap: (isHovered) =>
                    isHovered
                        ? new SideAppActionsView({ item: this.item })
                        : { tag: 'div' },
            },
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

class DesktopIconView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex justify-content-center align-items-center'
    public readonly style = {
        width: '75px',
        height: '75px',
    }
    public readonly children: ChildrenLike
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
            {
                source$: this.defaultOpeningApp$,
                vdomMap: (
                    defaultResp:
                        | { appInfo: OsCore.ApplicationInfo }
                        | undefined,
                ) => {
                    if (!defaultResp) {
                        return { tag: 'div', class: 'fas fa-file fa-3x' }
                    }
                    return defaultResp.appInfo.graphics.appIcon
                },
                untilFirst: {
                    tag: 'div',
                    class: 'd-flex align-items-center position-relative',
                    children: [
                        { tag: 'div', class: 'fas fa-file fa-3x' },
                        {
                            tag: 'div',
                            class: 'fas fa-spinner w-100 fa-spin fv-text-secondary text-center position-absolute',
                        },
                    ],
                },
            },
        ]
    }
}

class DesktopNameView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'd-flex justify-content-center align-items-center mt-1'
    public readonly style = {
        height: '43px',
    }
    public readonly children: ChildrenLike

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
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

class SideAppActionsView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex flex-column' //: Stream$<boolean, string>
    public readonly style = {
        position: 'absolute' as const,
        top: '5px',
        right: '5%',
    }
    public readonly defaultOpeningApp$: Observable<{
        appInfo: OsCore.ApplicationInfo
    }>
    public readonly connectedCallback = (elem) => elem.stopPropagation

    public readonly children: ChildrenLike

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
            {
                source$: this.defaultOpeningApp$,
                vdomMap: (
                    defaultResp:
                        | {
                              appInfo: OsCore.ApplicationInfo
                          }
                        | undefined,
                ) => {
                    if (!defaultResp) {
                        return { tag: 'div' }
                    }
                    return new SideAppRunAction({ item: params.item })
                },
            },
            {
                source$: OsCore.RequestsExecutor.getAsset(assetId),
                vdomMap: (asset: AssetsBackend.AssetBase) => {
                    return asset.description
                        ? new SideAppInfoAction({
                              item: params.item,
                              text: asset.description,
                          })
                        : { tag: 'div' }
                },
            },
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

class SideAppRunAction implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = basedActionsClass

    public readonly style = basedActionsStyle
    public readonly children: ChildrenLike
    public readonly onclick: () => void

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
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

class SideAppInfoAction implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = basedActionsClass
    public readonly style = basedActionsStyle
    public readonly children: ChildrenLike
    public readonly onclick: () => void

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
        text: string
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
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

class SideAppRemoveAction implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = basedActionsClass

    public readonly style = basedActionsStyle
    public readonly children: ChildrenLike
    public readonly onclick: () => void

    constructor(params: {
        item: ExplorerBackend.GetItemResponse | ApplicationInfo
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
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
        install({
            modules: [`marked#${setup.runTimeDependencies.externals.marked}`],
        }) as unknown as Promise<{ marked: typeof Marked }>,
    ).pipe(map(({ marked }) => marked))
}

class AppDescriptionView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'vw-50 vh-50 rounded mx-auto my-auto p-4 yw-bg-dark  yw-box-shadow yw-animate-in '
    public readonly children: ChildrenLike

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
            {
                source$: installMarked$(),
                vdomMap: (markedModule: { parse: (string) => string }) => ({
                    tag: 'div',
                    class: 'fv-text-primary mt-4 mb-4 text-start overflow-auto',
                    style: {
                        width: '50vh',
                        maxHeight: '50vh',
                    },
                    innerHTML: markedModule.parse(params.text),
                }),
            },
            {
                tag: 'div',
                class: 'd-flex  fv-text-primary yw-hover-text-dark justify-content-center',
                children: [new CanclePopupButtonView()],
            },

            new ClosePopupButtonView(),
        ]
    }
}

class ConfirmRemoveActionView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'w-100 rounded mx-auto my-auto p-4 yw-bg-dark  yw-box-shadow yw-animate-in'

    public readonly children: ChildrenLike

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
                tag: 'div',
                class: 'fv-text-primary mt-4 mb-4 text-center',
                innerText: 'Remove from desktop?',
            },

            {
                tag: 'div',
                class: 'd-flex  fv-text-primary yw-hover-text-dark justify-content-between',
                children: [
                    new CanclePopupButtonView(),
                    {
                        tag: 'div',
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

export class PopupHeaderView implements VirtualDOM<'i'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'i'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: string
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor({ title, fa }: { title: string; fa: string }) {
        this.children = [
            {
                tag: 'div',
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

export class CanclePopupButtonView implements VirtualDOM<'span'> {
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

export class ClosePopupButtonView implements VirtualDOM<'span'> {
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
        position: 'absolute' as const,
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
