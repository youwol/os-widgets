import { DockableTabs } from '@youwol/rx-tab-views'
import { ChildrenLike, RxHTMLElement, VirtualDOM } from '@youwol/rx-vdom'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { filter, map, mergeMap, take } from 'rxjs/operators'
import { AssetsGateway, ExplorerBackend } from '@youwol/http-clients'
import { BehaviorSubject, Observable } from 'rxjs'
import { Select } from '@youwol/rx-input-views'

import {
    AnyFolderNode,
    ItemNode,
    BrowserNode,
    DeletedItemNode,
    ExplorerState,
    FutureItemNode,
    GroupNode,
    installContextMenu,
    RegularFolderNode,
    TreeGroup,
} from '../..'
import { Favorite, FavoritesFacade } from '@youwol/os-core'

const leftNavClasses = 'fv-bg-background fv-x-lighter h-100 overflow-auto'
const leftNavStyle = {
    width: '300px',
}

export class SideNavTab extends DockableTabs.Tab {
    protected constructor(params: {
        id: string
        state: ExplorerState
        content: () => VirtualDOM<'div'>
        title: string
        icon: string
    }) {
        super({ ...params, id: params.id })
    }
}

export class MySpaceTab extends SideNavTab {
    constructor(params: {
        state: ExplorerState
        selectedTab$: Observable<string>
    }) {
        super({
            id: 'MySpace',
            title: 'My space',
            icon: 'fas fa-user',
            state: params.state,
            content: () => {
                return {
                    source$: params.selectedTab$.pipe(
                        filter((id) => id == 'MySpace'),
                        mergeMap(() => {
                            return params.state.defaultUserDrive$
                        }),
                        take(1),
                        mergeMap((defaultUserDrive) => {
                            return params.state.selectGroup$(
                                defaultUserDrive.groupId,
                            )
                        }),
                    ),
                    vdomMap: (treeGroup: TreeGroup) => {
                        return new GroupView({
                            explorerState: params.state,
                            treeGroup,
                        })
                    },
                } as unknown as VirtualDOM<'div'>
            },
        })
        Object.assign(this, params)
    }
}

export class GroupTab extends SideNavTab {
    constructor(params: {
        state: ExplorerState
        group: ExplorerBackend.GetGroupResponse
        selectedTab$: Observable<string>
    }) {
        super({
            id: `Group#${params.group.id}`,
            title: params.group.path.split('/').slice(-1)[0],
            icon: 'fas fa-map-pin',
            state: params.state,
            content: () => {
                return {
                    source$: params.selectedTab$.pipe(
                        filter((id) => id == `Group#${params.group.id}`),
                        mergeMap(() => {
                            return params.state.selectGroup$(params.group.id)
                        }),
                        take(1),
                    ),
                    vdomMap: (treeGroup: TreeGroup): VirtualDOM<'div'> => {
                        return new GroupView({
                            explorerState: params.state,
                            treeGroup:
                                params.state.groupsTree[treeGroup.groupId],
                        })
                    },
                    untilFirst: {
                        class: 'fas fa-spinner fa-spin text-center',
                        style: leftNavStyle,
                    },
                } as unknown as VirtualDOM<'div'>
            },
        })
        Object.assign(this, params)
    }
}

export class GroupsTab extends SideNavTab {
    constructor(params: {
        state: ExplorerState
        selectedTab$: Observable<string>
    }) {
        super({
            id: 'Groups',
            title: 'Groups',
            icon: 'fas fa-users',
            state: params.state,
            content: () => {
                return {
                    source$: params.selectedTab$.pipe(
                        filter((id) => id == 'Groups'),
                        mergeMap(() => {
                            return params.state.userInfo$
                        }),
                        take(1),
                    ),
                    vdomMap: (userInfo: AssetsGateway.UserInfoResponse) => {
                        return new GroupsTabView({
                            explorerState: params.state,
                            userInfo,
                        })
                    },
                } as unknown as VirtualDOM<'div'>
            },
        })
        Object.assign(this, params)
    }
}

export class GroupView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = leftNavClasses
    public readonly style = leftNavStyle

    public readonly children: ChildrenLike
    public readonly explorerState: ExplorerState
    public readonly treeGroup: TreeGroup

    constructor(params: {
        explorerState: ExplorerState
        treeGroup: TreeGroup
    }) {
        Object.assign(this, params)
        this.children = [
            {
                source$: FavoritesFacade.getFolders$(),
                vdomMap: (favoritesFolder: ExplorerBackend.FolderBase[]) => {
                    return new FavoritesView({
                        explorerState: this.explorerState,
                        favoritesFolder: favoritesFolder.filter(
                            (f) => f.groupId == this.treeGroup.groupId,
                        ),
                    })
                },
            },
            new TreeViewDrive({
                explorerState: this.explorerState,
                treeGroup: this.treeGroup,
            }),
        ]
    }
}

export class TreeViewDrive extends ImmutableTree.View<BrowserNode> {
    public readonly explorerState: ExplorerState
    public readonly treeGroup: TreeGroup
    static baseWrapperHeaderClass =
        'align-items-baseline fv-tree-header fv-hover-bg-background-alt rounded'
    static wrapperHeaderClassFct = (node) =>
        `${TreeViewDrive.baseWrapperHeaderClass} ${
            node instanceof GroupNode ? 'd-none' : 'd-flex '
        }`

    constructor(params: {
        explorerState: ExplorerState
        treeGroup: TreeGroup
    }) {
        super({
            state: params.treeGroup, //params.explorerState.groupsTree[params.groupId], //new TreeViewState(params),
            headerView: (_state, node: AnyFolderNode | ItemNode) => {
                if (
                    node instanceof ItemNode ||
                    node instanceof FutureItemNode ||
                    node instanceof DeletedItemNode
                ) {
                    return undefined
                }
                return new ExplorerFolderView({
                    treeGroup: this.treeGroup,
                    folderNode: node,
                })
            },
            options: {
                classes: {
                    header: TreeViewDrive.wrapperHeaderClassFct,
                    headerSelected: 'd-flex fv-text-focus',
                },
            },
            dropAreaView: () => ({ tag: 'div', class: 'w-100 my-1' }),
        })
        Object.assign(this, params)
        this.treeGroup.expandedNodes$.next([
            this.treeGroup.groupId,
            this.treeGroup.defaultDriveId,
            this.treeGroup.homeFolderId,
        ])
        this.explorerState.openFolder$
            .pipe(
                take(1),
                filter(({ tree }) => tree == this.treeGroup),
            )
            .subscribe((d) => {
                this.treeGroup.selectNodeAndExpand(d.folder)
            })
    }
}

class GroupSelectItemData extends Select.ItemData {
    constructor(public readonly group: AssetsGateway.GroupResponse) {
        super(group.path, group.path.split('/').slice(-1)[0])
    }
}

export class GroupsTabView implements VirtualDOM<'div'> {
    public readonly tag: 'div'
    public readonly class = 'w-100'

    public readonly children: ChildrenLike
    public readonly explorerState: ExplorerState
    public readonly userInfo: AssetsGateway.UserInfoResponse
    public readonly group$: BehaviorSubject<AssetsGateway.GroupResponse>

    constructor(params: {
        explorerState: ExplorerState
        userInfo: AssetsGateway.UserInfoResponse
    }) {
        Object.assign(this, params)
        const sortGroup = (a, b) => (a.path.length < b.path.length ? -1 : 1)

        const displayedGroups = this.userInfo.groups
            .filter((g) => g.path != 'private')
            .sort(sortGroup)

        this.group$ = new BehaviorSubject<AssetsGateway.GroupResponse>(
            displayedGroups[0],
        )
        const itemsData = displayedGroups.map((g) => new GroupSelectItemData(g))

        const selectState = new Select.State(itemsData, itemsData[0].id)
        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    // 'never' is used because of a flaw in constructor declaration of `Select.View`:
                    // the `...rest` parameters is not typed in the constructor.
                    new Select.View({
                        state: selectState,
                        class: 'w-100',
                    } as never),
                    {
                        source$: selectState.selection$.pipe(
                            map((s: GroupSelectItemData) => s.group),
                        ),
                        vdomMap: (group: AssetsGateway.GroupResponse) =>
                            new GroupPinBtn({
                                explorerState: this.explorerState,
                                groupId: group.id,
                            }),
                    },
                ],
            },
            {
                source$: selectState.selection$.pipe(
                    mergeMap((item: GroupSelectItemData) =>
                        this.explorerState.selectGroup$(item.group.id),
                    ),
                ),
                vdomMap: (treeGroup: TreeGroup) => {
                    return new GroupView({
                        explorerState: this.explorerState,
                        treeGroup,
                    })
                },
            },
        ]
    }
}

export class GroupPinBtn implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    public readonly activated$ = new BehaviorSubject(true)
    public readonly explorerState: ExplorerState
    public readonly groupId: string

    public readonly onclick = () => {
        FavoritesFacade.toggleFavoriteGroup(this.groupId)
    }

    constructor(params: { explorerState: ExplorerState; groupId: string }) {
        Object.assign(this, params)
        const baseClass =
            'fas fa-map-pin p-1 m-1 fv-hover-bg-background-alt rounded fv-pointer'
        this.children = [
            {
                tag: 'div',
                class: {
                    source$: FavoritesFacade.getGroups$().pipe(
                        map(
                            (groups: Favorite[]) =>
                                groups.find(
                                    (group) => group.id == this.groupId,
                                ) != undefined,
                        ),
                    ),
                    vdomMap: (activated): string =>
                        activated ? 'fv-text-focus' : '',
                    wrapper: (d) => `${d} ${baseClass}`,
                },
            },
        ]
    }
}

export class FavoriteItemView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'rounded fv-pointer px-1 m-1 fv-bg-background-alt fv-hover-xx-lighter'
    public readonly children: ChildrenLike
    public readonly explorerState: ExplorerState
    public readonly favoriteFolder: ExplorerBackend.GetFolderResponse
    public readonly loadingFolder$ = new BehaviorSubject(false)

    constructor(params: {
        explorerState: ExplorerState
        favoriteFolder: ExplorerBackend.GetFolderResponse
    }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    { tag: 'div', class: 'fas fa-map-pin mr-2' },
                    { tag: 'div', innerText: this.favoriteFolder.name },
                    {
                        source$: this.loadingFolder$,
                        vdomMap: (isLoading) => {
                            return isLoading
                                ? {
                                      tag: 'div',
                                      class: 'fas fa-folder-open fv-blink px-1',
                                  }
                                : { tag: 'div' }
                        },
                    },
                ],
                onclick: () => {
                    this.loadingFolder$.next(true)
                    this.explorerState
                        .navigateTo$(this.favoriteFolder.folderId)
                        .subscribe(() => this.loadingFolder$.next(false))
                },
            },
        ]
    }
}

export class FavoritesView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'w-100 d-flex flex-wrap overflow-auto'
    public readonly style = {
        maxHeight: '25%',
    }
    public readonly children
    public readonly explorerState: ExplorerState
    public readonly favoritesFolder: ExplorerBackend.GetFolderResponse[]

    constructor(params: {
        explorerState: ExplorerState
        favoritesFolder: ExplorerBackend.GetFolderResponse[]
    }) {
        Object.assign(this, params)
        this.children = this.favoritesFolder.map((folder) => {
            return new FavoriteItemView({
                explorerState: this.explorerState,
                favoriteFolder: folder,
            })
        })
    }
}

export class ExplorerFolderView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'align-items-center fv-pointer w-100 d-flex'
    public readonly treeGroup: TreeGroup
    public readonly folderNode: AnyFolderNode

    public readonly onclick = () => {
        this.treeGroup.explorerState.openFolder(this.folderNode)
    }
    public readonly children: ChildrenLike

    public readonly connectedCallback = (elem: RxHTMLElement<'div'>) => {
        installContextMenu({
            node: this.folderNode,
            div: elem,
            state: this.treeGroup.explorerState,
        })
    }

    constructor(params: { treeGroup: TreeGroup; folderNode: AnyFolderNode }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                class: `${this.folderNode.icon} mr-2`,
            },
            {
                source$: this.folderNode.status$.pipe(
                    filter((status) =>
                        status.map((s) => s.type).includes('renaming'),
                    ),
                ),
                vdomMap: (): VirtualDOM<'input'> => {
                    return this.headerRenamed()
                },
                untilFirst: {
                    tag: 'div',
                    innerText: this.folderNode.name,
                },
            },
        ]
    }

    headerRenamed(): VirtualDOM<'input'> {
        return {
            tag: 'input',
            type: 'text',
            autofocus: true,
            style: {
                zIndex: 200,
            },
            class: 'mx-2',
            value: this.folderNode.name,
            onclick: (ev) => ev.stopPropagation(),
            onkeydown: (ev) => {
                if (ev.key === 'Enter' && this.folderNode.kind == 'regular') {
                    this.treeGroup.explorerState.rename(
                        this.folderNode as RegularFolderNode,
                        ev.target['value'],
                    )
                }
            },
            connectedCallback: (elem: HTMLElement) => {
                elem.focus()
            },
        }
    }
}
