import {
    AnyVirtualDOM,
    ChildrenLike,
    render,
    RxHTMLElement,
    VirtualDOM,
} from '@youwol/rx-vdom'
import { Modal } from '@youwol/rx-group-views'
import { from, merge } from 'rxjs'
import { take } from 'rxjs/operators'
import { install } from '@youwol/webpm-client'
import { textStyle } from './section.view'

export class CellHeader implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex flex-wrap align-items-center'
    public readonly children: ChildrenLike
    constructor({
        imageUrl,
        title,
        scaleFactor,
        more,
    }: {
        imageUrl: string
        title: string
        scaleFactor?: number
        more?: string
    }) {
        const s = scaleFactor || 1
        this.children = [
            {
                tag: 'img',
                width: s * 75,
                height: s * 75,
                src: imageUrl,
            },
            {
                tag: 'div',
                class: 'd-flex flex-column align-items-center',
                children: [
                    {
                        class: 'm-2',
                        tag: 'h6',
                        style: {
                            fontWeight: 600,
                            fontSize: `${s * 16}px`,
                        },
                        innerText: title,
                    },
                    more
                        ? new MoreButton(title, more, imageUrl)
                        : { tag: 'div' },
                ],
            },
        ]
    }
}
export class CardView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'd-flex  flex-column align-items-center text-justify p-2 m-3 rounded fv-border-left-focus fv-border-bottom-focus'
    public readonly children: ChildrenLike
    public readonly style = {
        ...textStyle,
        width: '280px',
    }
    constructor({
        imageUrl,
        abstract,
        title,
        more,
    }: {
        imageUrl: string
        abstract: string | AnyVirtualDOM
        title: string
        more?: string
    }) {
        this.children = [
            new CellHeader({ imageUrl, title, more }),
            {
                tag: 'div',
                class: 'm-2 h-100',
                children: [
                    typeof abstract === 'string'
                        ? {
                              tag: 'div',
                              innerHTML: abstract,
                              style: {
                                  display: 'inline' as const,
                              },
                          }
                        : abstract,
                ],
            },
        ]
    }
}

export class EmptyCard implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'col-md-4 d-flex  align-items-center'
    public readonly children: ChildrenLike
    constructor() {
        this.children = []
    }
}

class MoreButton implements VirtualDOM<'i'> {
    public readonly tag = 'i'
    public readonly class =
        'text-center rounded fas fa-info-circle fv-pointer fv-bg-background fv-text-focus p-1 mx-1'
    public readonly onclick: (ev: MouseEvent) => void
    constructor(title: string, markdown: string, imageUrl: string) {
        this.onclick = () => {
            popupModal(() => ({
                tag: 'div',
                class: 'border p-5 rounded overflow-auto',
                style: {
                    position: 'relative',
                    color: 'black',
                    backgroundColor: 'white',
                    width: '75vw',
                    maxWidth: '800px',
                    maxHeight: '75vh',
                },
                children: [
                    new CellHeader({ imageUrl, title, scaleFactor: 2 }),
                    { tag: 'div', class: 'my-5' },
                    {
                        source$: from(install({ modules: ['marked#^4.2.3'] })),
                        vdomMap: ({ marked }) => {
                            const parsed = marked.parse(markdown)
                            return {
                                tag: 'div',
                                class: 'text-justify',
                                innerHTML: parsed,
                            }
                        },
                    },
                ],
            }))
        }
    }
}

export function popupModal(
    contentView: (modalState) => VirtualDOM<'div'>,
    sideEffect = (_htmlElement: HTMLDivElement, _state: Modal.State) => {
        /* noop*/
    },
) {
    const modalState = new Modal.State()

    const view = new Modal.View({
        state: modalState,
        contentView,
        connectedCallback: (elem: RxHTMLElement<'div'>) => {
            sideEffect(elem, modalState)
            elem.children[0].classList.add('fv-text-primary')
            // https://stackoverflow.com/questions/63719149/merge-deprecation-warning-confusion
            merge(...[modalState.cancel$, modalState.ok$])
                .pipe(take(1))
                .subscribe(() => {
                    modalDiv.remove()
                })
        },
    })
    const modalDiv = render(view)
    document.querySelector('body').appendChild(modalDiv)
}
