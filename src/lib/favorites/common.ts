import { HTMLElement$, render, VirtualDOM } from '@youwol/flux-view'
import { merge } from 'rxjs'
import { take } from 'rxjs/operators'
import { Modal } from '@youwol/fv-group'

export function popupModal(
    contentView: (modalState: Modal.State) => VirtualDOM,
    sideEffect = (_htmlElement: HTMLDivElement, _state: Modal.State) => {
        /* noop*/
    },
) {
    const modalState = new Modal.State()
    const view = new Modal.View({
        state: modalState,
        contentView,
        connectedCallback: (elem: HTMLDivElement & HTMLElement$) => {
            sideEffect(elem, modalState)
            elem.children[0].classList.add('fv-text-primary')
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
