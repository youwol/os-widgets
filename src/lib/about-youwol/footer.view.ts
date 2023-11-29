import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { YouWolLogo } from './common'

export class FooterView implements VirtualDOM<'div'> {
    public readonly tag: 'div'
    public readonly class = 'mx-auto p-2'
    public readonly children: ChildrenLike
    public readonly style = {
        fontWeight: 600,
        fontSize: '2em',
    }
    constructor() {
        this.children = [
            {
                tag: 'div',
                class: 'd-flex justify-content-center',
                children: [
                    {
                        tag: 'div',
                        class: 'p-4',
                        style: {
                            width: '500px',
                            height: '300px',
                        },

                        children: [
                            {
                                tag: 'div',
                                class: 'mx-auto text-center',
                                innerText: '',
                            },
                            { tag: 'div', class: 'my-4' },
                            {
                                tag: 'div',
                                class: 'd-flex justify-content-center',
                                children: [
                                    { tag: 'div', innerHTML: YouWolLogo },
                                ],
                            },
                            {
                                tag: 'div',
                                class: 'd-flex',
                                children: [
                                    {
                                        tag: 'div',
                                        class: 'w-100 text-right',
                                        innerText: '',
                                    },
                                    { tag: 'div', class: 'w-100' },
                                    {
                                        tag: 'div',
                                        class: 'w-100',
                                        innerText: '',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]
    }
}
