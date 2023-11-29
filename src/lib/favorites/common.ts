import { AnyVirtualDOM, render } from '@youwol/rx-vdom'
import { merge, take } from 'rxjs'
import { Modal } from '@youwol/rx-group-views'

export function popupModal(
    contentView: (modalState: Modal.State) => AnyVirtualDOM,
    sideEffect = (_htmlElement: HTMLDivElement, _state: Modal.State) => {
        /* noop*/
    },
) {
    const modalState = new Modal.State()
    const view = new Modal.View({
        state: modalState,
        contentView,
        connectedCallback: (elem: HTMLDivElement) => {
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
