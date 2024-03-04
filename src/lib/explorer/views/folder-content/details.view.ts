import { ChildrenLike, RxHTMLElement, VirtualDOM } from '@youwol/rx-vdom'
import { ExplorerState } from '../../explorer.state'
import { AnyFolderNode, AnyItemNode, ItemNode, ProgressNode } from '../../nodes'
import { ItemView, ProgressItemView } from './item.view'
import { installContextMenu } from '../../context-menu/context-menu'

export class DetailsContentView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'fv-text-primary w-100 h-100 d-flex flex-column text-center overflow-auto'
    public readonly style = { maxHeight: '100%' }
    public readonly children: ChildrenLike

    public readonly folder: AnyFolderNode
    public readonly items: AnyItemNode[]

    public readonly state: ExplorerState
    public readonly onclick = () => this.state.selectedItem$.next(undefined)
    public readonly oncontextmenu = () =>
        this.state.selectedItem$.next(undefined)

    public readonly connectedCallback = (elem: RxHTMLElement<'div'>) => {
        installContextMenu({
            state: this.state,
            div: elem,
            node: this.folder,
        })
    }

    constructor(params: {
        state: ExplorerState
        items: AnyItemNode[]
        folder: AnyFolderNode
    }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                class: 'flex-grow-1 overflow-auto',
                children: this.items.map((item: ItemNode) =>
                    item instanceof ProgressNode
                        ? new ProgressItemView({ state: this.state, item })
                        : new ItemView({ state: this.state, item }),
                ),
            },
        ]
    }
}
