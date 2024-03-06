import {
    AnyVirtualDOM,
    ChildrenLike,
    RxAttribute,
    VirtualDOM,
} from '@youwol/rx-vdom'
import { Button } from '@youwol/rx-button-views'
import { BehaviorSubject } from 'rxjs'

export class IconButtonView implements VirtualDOM<'div'> {
    static ClassSelector = 'icon-button-view'
    public readonly baseClass = `${IconButtonView.ClassSelector} fas fv-pointer fv-text-x-lighter fv-hover-text border rounded p-2`
    public readonly tag = 'div'
    public readonly class: string
    public readonly innerText = ' Add Tags :'
    public readonly onclick: (ev: MouseEvent) => void
    public readonly style: { [key: string]: string }
    public readonly icon: string
    public readonly setChildren: ChildrenLike
    public readonly children: ChildrenLike

    constructor(params: {
        onclick: (ev: MouseEvent) => void
        icon: string
        withClasses?: string
        style?: { [key: string]: string }
        setChildren?: ChildrenLike
    }) {
        Object.assign(this, params)
        this.class = `${this.baseClass} ${this.icon} ${
            params.withClasses || ''
        }`
        this.children = this.setChildren
    }
}

export class ButtonView extends Button.View {
    tag: 'button'
    class = 'fv-btn fv-bg-secondary fv-hover-x-lighter'

    constructor({
        name,
        icon,
        withClass,
        enabled,
    }: {
        name: string
        icon: string
        withClass: string
        enabled: boolean
    }) {
        super({
            state: new Button.State(),
            contentView: () => ({
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    { tag: 'div', class: icon },
                    {
                        tag: 'div',
                        class: 'ml-1',
                        innerText: name,
                    },
                ],
            }),
            disabled: !enabled,
        })
        this.class = `${this.class} ${withClass}`
    }
}

export class TextEditableView implements VirtualDOM<'div'> {
    static ClassSelector = 'text-editable-view'
    public readonly tag = 'div'
    public readonly class = `${TextEditableView.ClassSelector} d-flex justify-content-center align-items-center`
    public readonly children: ChildrenLike
    public readonly editionMode$ = new BehaviorSubject(false)

    public readonly text$: BehaviorSubject<string>
    public readonly attrText$: RxAttribute<string, string>
    public readonly regularView: (text$) => AnyVirtualDOM
    public readonly templateEditionView: AnyVirtualDOM

    public readonly ondblclick = () => {
        this.editionMode$.next(true)
    }
    constructor(params: {
        text$: BehaviorSubject<string>
        regularView: (text$: BehaviorSubject<string>) => AnyVirtualDOM
        templateEditionView?: AnyVirtualDOM
        [key: string]: unknown
    }) {
        Object.assign(this, params)
        this.templateEditionView = this.templateEditionView || {
            tag: 'input',
            type: 'text',
        }
        this.attrText$ = {
            source$: this.text$,
            vdomMap: (text: string) => text,
                return text
        }
        this.children = [
            {
                tag: 'div',
                class: 'fas fa-tag mr-1',
            },
            {
                source$: this.editionMode$,
                vdomMap: (isEditing) =>
                    isEditing
                        ? this.editionView()
                        : this.regularView(this.text$),
            },
        ]
    }

    editionView() {
        return {
            ...this.templateEditionView,
            placeholder: `${this.attrText$}`,
            value: `${this.attrText$}`,
            placeholder: this.attrText$,
            value: this.attrText$,
            onkeydown: (ev: KeyboardEvent) => {
                if (ev.key == 'Enter' && !ev.shiftKey) {
                    console.log(ev)
                    this.editionMode$.next(false)
                    this.text$.next(ev.target['value'])
                }
            },
        } as AnyVirtualDOM
    }
}
