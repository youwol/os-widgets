import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { merge, Observable } from 'rxjs'
import { ExplorerState, TreeGroup } from '../explorer.state'
import { AnyFolderNode, BrowserNode } from '../nodes'

export class HeaderPathView implements VirtualDOM<'div'> {
    public readonly tag: 'div'
    static ClassSelector = 'header-path-view'
    public readonly class = `${HeaderPathView.ClassSelector} w-100 d-flex justify-content-center p-2 fv-bg-background-alt`
    style = {
        height: '50px',
    }
    public readonly children: ChildrenLike // Stream$<Nodes.FolderNode, VirtualDOM[]>

    public readonly state: ExplorerState

    constructor(params: { state: ExplorerState; [k: string]: unknown }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                class: 'd-flex flex-grow-1 justify-content-center overflow-auto mr-1 align-items-center',
                style: {
                    whiteSpace: 'nowrap',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                },
                children: {
                    policy: 'replace',
                    source$: this.state.openFolder$,
                    vdomMap: ({
                        tree,
                        folder,
                    }: {
                        tree: TreeGroup
                        folder: AnyFolderNode
                    }) => {
                        const path = tree.reducePath(folder.id, (node) => {
                            return node
                        })
                        const items: AnyVirtualDOM[][] = path.map((node) => [
                            new PathElementView({
                                state: this.state,
                                node: node as AnyFolderNode, // XXX : Review Type
                                selectedNode: folder,
                            }),
                            {
                                tag: 'div',
                                class: 'px-2 my-auto',
                                innerText: '/',
                            },
                        ])
                        return items
                            .flat()
                            .slice(0, -1)
                            .concat([
                                new LoadingSpinnerView({
                                    isLoading$: merge(
                                        ...path.map((n) => n.status$),
                                    ),
                                }),
                            ])
                    },
                },
            },
        ]
    }
}

export class LoadingSpinnerView implements VirtualDOM<'div'> {
    public readonly tag: 'div'
    static ClassSelector = 'loading-spinner-view'

    public readonly class = `${LoadingSpinnerView.ClassSelector} h-100 d-flex flex-column justify-content-center px-2`
    public readonly children: ChildrenLike

    public readonly isLoading$: Observable<{ type: string; id: string }[]>

    constructor(params: {
        isLoading$: Observable<{ type: string; id: string }[]>
    }) {
        Object.assign(this, params)

        this.children = [
            {
                source$: this.isLoading$,
                vdomMap: (status: { type: string; id: string }[]) => {
                    return status.find((s) => s.type == 'request-pending')
                        ? { tag: 'div', class: 'fas fa-spinner fa-spin' }
                        : { tag: 'div' }
                },
            },
        ]
    }
}

export class PathElementView implements VirtualDOM<'div'> {
    public readonly tag: 'div'
    static ClassSelector = 'path-elem-view'
    public readonly baseClass = `${PathElementView.ClassSelector} rounded px-1 d-flex align-items-center fv-pointer fv-bg-background fv-hover-bg-background-alt`

    public readonly class: string
    public readonly children: ChildrenLike
    public readonly node: AnyFolderNode
    public readonly selectedNode: BrowserNode

    public readonly state: ExplorerState

    public readonly onclick = () => {
        this.state.openFolder(this.node)
    }

    constructor(params: {
        state: ExplorerState
        node: AnyFolderNode
        selectedNode: BrowserNode
    }) {
        Object.assign(this, params)

        this.class =
            this.node.id == this.selectedNode.id
                ? `${this.baseClass} fv-text-focus`
                : `${this.baseClass}`

        this.children = [
            { tag: 'div', class: this.node.icon },
            { tag: 'div', class: 'px-1', innerText: this.node.name },
        ]
    }
}
