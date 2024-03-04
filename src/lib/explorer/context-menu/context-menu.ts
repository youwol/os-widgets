import { ContextMenu } from '@youwol/rx-context-menu-views'
import { fromEvent, Observable } from 'rxjs'
import { shareReplay, tap } from 'rxjs/operators'
import {
    AnyVirtualDOM,
    ChildrenLike,
    RxHTMLElement,
    VirtualDOM,
} from '@youwol/rx-vdom'
import * as _ from 'lodash'
import { ExplorerState } from '../explorer.state'
import { BrowserNode } from '../nodes'
import { Action, getActions$ } from '../actions.factory'

export class ContextMenuState extends ContextMenu.State {
    public readonly appState: ExplorerState
    public readonly div: RxHTMLElement<'div'>
    public readonly node: BrowserNode

    constructor(params: {
        div: RxHTMLElement<'div'>
        node: BrowserNode
        appState: ExplorerState
    }) {
        super(
            fromEvent(params.div, 'contextmenu').pipe(
                tap((ev: Event) => ev.preventDefault()),
            ) as Observable<MouseEvent>,
        )
        Object.assign(this, params)
    }

    dispatch(_ev: MouseEvent): AnyVirtualDOM {
        return {
            tag: 'div',
            style: {
                zIndex: 1,
            },
            children: [
                new ContextMenuInnerView({
                    state: this,
                    selectedNode: this.node,
                }),
            ],
        }
    }
}

export function installContextMenu({
    node,
    state,
    div,
}: {
    node: BrowserNode
    state: ExplorerState
    div: RxHTMLElement<'div'>
}) {
    return new ContextMenu.View({
        state: new ContextMenuState({
            appState: state,
            div: div,
            node: node,
        }),
        style: {
            zIndex: 20,
        },
    })
}

/**
 * Context-menu view
 */
export class ContextMenuInnerView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'fv-bg-background fv-x-lighter fv-text-primary py-1 container'
    public readonly style = {
        boxShadow: '0px 0px 3px white',
        fontFamily: 'serif',
        width: '300px',
    }
    public readonly id = 'context-menu-view'
    public readonly children: ChildrenLike

    public readonly connectedCallback: (element: RxHTMLElement<'div'>) => void

    public readonly state: ContextMenuState
    public readonly selectedNode: BrowserNode

    constructor(params: {
        state: ContextMenuState
        selectedNode: BrowserNode
    }) {
        Object.assign(this, params)
        const actions$ = getActions$(
            this.state.appState,
            this.selectedNode,
        ).pipe(shareReplay({ bufferSize: 1, refCount: true }))

        this.children = [
            {
                tag: 'div',
                class: {
                    source$: actions$,
                    vdomMap: () => 'd-none',
                    untilFirst: 'w-100 text-center fas fa-spinner fa-spin',
                },
            },
            {
                tag: 'div',
                class: 'w-100 h-100',
                children: {
                    policy: 'replace',
                    source$: actions$,
                    vdomMap: (actions: Action[]) => {
                        return Object.entries(
                            _.groupBy(actions, (d: Action) => d.section),
                        )
                            .map(([section, groupActions]) => {
                                return [
                                    new ContextSplitterView(),
                                    new ContextSectionView({
                                        section,
                                        actions: groupActions as Action[],
                                    }),
                                ]
                            })
                            .flat()
                            .slice(1)
                    },
                },
            },
        ]
    }
}

export class ContextSplitterView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'fv-border-bottom-background-alt mx-auto my-1 w-100'
}

export class ContextSectionView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    public readonly actions: Action[]

    constructor(params: { section: string; actions: Action[] }) {
        Object.assign(this, params)
        this.children = this.actions.map((action: Action) => {
            return new ContextItemView({ action })
        })
    }
}

export class ContextItemView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class: string

    public readonly children: ChildrenLike
    public readonly action: Action
    public readonly onclick = () => {
        this.action.exe()
    }

    constructor(params: { action: Action }) {
        Object.assign(this, params)
        const baseClass = `d-flex align-items-center row`
        this.class = this.action.enabled()
            ? `${baseClass}  fv-hover-bg-secondary fv-hover-x-lighter  fv-pointer`
            : `${baseClass} fv-text-disabled`
        this.children = [
            {
                tag: 'div',
                class: `col-3 text-center px-1`,
                children: [this.action.icon],
            },
            { tag: 'div', class: `col-9`, innerText: this.action.name },
        ]
    }
}
