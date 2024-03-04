import { ChildrenLike, RxAttribute, VirtualDOM } from '@youwol/rx-vdom'

import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs'
import { filter, map } from 'rxjs/operators'

import { ExplorerState } from '../../explorer.state'
import {
    BrowserNode,
    DeletedItemNode,
    FutureItemNode,
    ItemNode,
    ProgressNode,
} from '../../nodes'
import { installContextMenu } from '../../context-menu/context-menu'
import {
    ApplicationInfo,
    OpenWithParametrization,
    tryOpenWithDefault$,
    defaultOpeningApp$,
} from '@youwol/os-core'
import { AssetsGateway, ExplorerBackend } from '@youwol/http-clients'
import { setup } from '../../../../auto-generated'

export class ProgressItemView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static ClassSelector = 'progress-item-view'
    public readonly class = `${ProgressItemView.ClassSelector} d-flex flex-column p-1 rounded m-3 fv-hover-bg-background-alt fv-pointer`
    public readonly children: ChildrenLike
    public readonly item: ProgressNode

    constructor(params: {
        state: ExplorerState
        item: ProgressNode
        hovered$?: Observable<BrowserNode>
    }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    {
                        tag: 'div',
                        class:
                            this.item.direction == 'download'
                                ? 'fas fa-arrow-alt-circle-down px-2 fv-blink'
                                : 'fas fa-arrow-alt-circle-up px-2 fv-blink',
                    },
                    {
                        tag: 'div',
                        innerText: this.item.name,
                    },
                ],
            },
            {
                tag: 'div',
                class: 'w-100 border rounded',
                children: [
                    {
                        tag: 'div',
                        style: {
                            source$: this.item.progress$.pipe(
                                filter((progress) => progress.totalCount > 0),
                                map((progress) =>
                                    Math.floor(
                                        (100 * progress.transferredCount) /
                                            progress.totalCount,
                                    ),
                                ),
                            ),
                            vdomMap: (progress) => ({
                                backgroundColor: 'green',
                                width: `${progress}%`,
                                height: '5px',
                            }),
                        },
                    },
                ],
            },
        ]
    }
}

type ItemViewNode = ItemNode | FutureItemNode | DeletedItemNode

export class ItemView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static ClassSelector = 'item-view'
    public readonly baseClasses = `${ItemView.ClassSelector} d-flex align-items-center p-1 rounded fv-hover-bg-background-alt fv-pointer`
    public readonly class: RxAttribute<[BrowserNode, boolean], string>
    public readonly children: ChildrenLike
    public readonly style: RxAttribute<
        { type: string; id: string }[],
        { [key: string]: string }
    >
    public readonly contextMenuSelection$ = new BehaviorSubject(false)
    public readonly defaultOpeningApp$: Observable<
        | {
              appInfo: ApplicationInfo
              parametrization: OpenWithParametrization
          }
        | undefined
    >
    public readonly onclick = (ev: PointerEvent) => {
        this.state.selectItem(this.item)
        ev.stopPropagation()
    }

    public readonly ondblclick = (ev: PointerEvent) => {
        if (this.item instanceof ItemNode) {
            tryOpenWithDefault$(this.item).subscribe()
        }
        this.state.selectItem(this.item)
        ev.stopPropagation()
    }
    public readonly state: ExplorerState
    public readonly item: ItemViewNode
    public readonly assetsClient = new AssetsGateway.Client().assets
    public readonly oncontextmenu = (ev) => {
        ev.stopPropagation()
    }

    public readonly connectedCallback = (elem) => {
        const view = installContextMenu({
            state: this.state,
            div: elem,
            node: this.item,
        })
        view.state.event$
            .pipe(filter((event) => event == 'displayed'))
            .subscribe(() => this.contextMenuSelection$.next(true))
        view.state.event$
            .pipe(filter((event) => event == 'removed'))
            .subscribe(() => this.contextMenuSelection$.next(false))
    }

    constructor(params: { state: ExplorerState; item: ItemViewNode }) {
        Object.assign(this, params)
        this.defaultOpeningApp$ = ExplorerBackend.isInstanceOfItemResponse(
            this.item,
        )
            ? defaultOpeningApp$(this.item)
            : of(undefined)

        this.class = {
            source$: combineLatest([
                this.state.selectedItem$,
                this.contextMenuSelection$,
            ]),
            vdomMap: ([node, rightClick]: [
                node: BrowserNode,
                rightClick: boolean,
            ]): string => {
                const base = `${this.baseClasses} ${
                    rightClick ? 'fv-bg-background-alt' : ''
                }`
                return node && node.id == this.item.id
                    ? `${base} fv-text-focus`
                    : `${base}`
            },
            untilFirst: this.baseClasses,
        }

        this.style = {
            source$: this.item.status$,
            vdomMap: (statuses: { type; id }[]) =>
                statuses.find((s) => s.type == 'cut') != undefined
                    ? { opacity: '0.3' }
                    : {},

            wrapper: (d) => ({ ...d, userSelect: 'none' }),
        }

        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center flex-grow-1',
                style: { minWidth: '0px' },
                children: [
                    {
                        source$: this.defaultOpeningApp$,
                        vdomMap: (appData: {
                            appInfo: ApplicationInfo
                            parametrization: OpenWithParametrization
                        }) => {
                            return appData &&
                                appData.appInfo.graphics &&
                                appData.appInfo.graphics.fileIcon
                                ? {
                                      tag: 'div',
                                      style: {
                                          height: '25px',
                                          width: '25px',
                                      },
                                      children: [
                                          appData.appInfo.graphics.fileIcon,
                                      ],
                                  }
                                : new UndefinedIconFileView()
                        },
                    },
                    {
                        source$: this.item.status$,
                        vdomMap: (
                            statusList: { type: string; id: string }[],
                        ) =>
                            statusList.find((s) => s.type == 'renaming')
                                ? this.editView()
                                : {
                                      tag: 'div',
                                      innerText: this.item.name,
                                      class: 'mx-2',
                                      style: {
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                      },
                                  },
                    },
                ],
            },
            this.originView(this.item),
            {
                source$: this.item.status$,
                vdomMap: (status: { type: string; id: string }[]) => {
                    return status.find((s) => s.type == 'request-pending')
                        ? {
                              tag: 'div',
                              class: 'fas fa-spinner fa-spin',
                          }
                        : { tag: 'div' }
                },
            },
        ]
    }

    originView(node: BrowserNode): VirtualDOM<'div'> {
        return {
            tag: 'div',
            class: 'd-flex align-items-center ml-auto',
            children: [
                this.item instanceof ItemNode && this.item.borrowed
                    ? { tag: 'div', class: 'fas fa-link pr-1 py-1' }
                    : undefined,
                node.origin && node.origin.local
                    ? { tag: 'div', class: 'fas fa-laptop py-1' }
                    : undefined,
                node.origin && node.origin.remote
                    ? { tag: 'div', class: 'fas fa-cloud py-1' }
                    : undefined,
            ],
        }
    }

    editView(): VirtualDOM<'input'> {
        return {
            tag: 'input',
            type: 'text',
            autofocus: true,
            style: { zIndex: 200 },
            class: 'mx-2',
            value: this.item.name,
            onclick: (ev) => ev.stopPropagation(),
            onkeydown: (ev) => {
                if (ev.key === 'Enter') {
                    this.state.rename(this.item as ItemNode, ev.target['value'])
                }
            },
        }
    }
}

export class UndefinedIconFileView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly style = {
        height: '25px',
        width: '25px',
    }
    public readonly children: ChildrenLike

    constructor() {
        this.children = [
            {
                tag: 'div',
                style: {
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url('/api/assets-gateway/cdn-backend/resources/${setup.assetId}/${setup.version}/assets/undefined_app.svg')`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center center',
                    filter: 'drop-shadow(rgb(0, 0, 0) 1px 3px 5px)',
                    borderRadius: '15%',
                },
            },
        ]
    }
}
