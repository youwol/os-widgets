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
    public readonly inputTagValue$: BehaviorSubject<string>

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

        this.inputTagValue$ = new BehaviorSubject<string>(this.text$.value)
        this.templateEditionView = this.templateEditionView || {
            tag: 'input',
            type: 'text',
        }
        this.attrText$ = {
            source$: this.text$,
            vdomMap: (text: string) => {
                this.inputTagValue$.next(text)
                return text
            },
        }
        this.children = {
            policy: 'replace',
            source$: this.editionMode$,
            vdomMap: (isEditing) =>
                isEditing
                    ? [
                          {
                              tag: 'div',
                              class: 'fas fa-tag fa-xs mr-1',
                          },
                          this.editionView(),
                          this.saveBtnView(),
                      ]
                    : [
                          {
                              tag: 'div',
                              class: 'fas fa-tag fa-xs mr-1',
                          },
                          this.regularView(this.text$),
                      ],
        }
    }

    editionView() {
        return {
            ...this.templateEditionView,
            placeholder: this.attrText$,
            value: this.attrText$,
            class: 'text-center',
            onkeyup: (ev: KeyboardEvent) => {
                this.inputTagValue$.next(ev.target['value'])
            },
            onkeydown: (ev: KeyboardEvent) => {
                if (ev.key == 'Enter' && !ev.shiftKey) {
                    this.editionMode$.next(false)
                    this.text$.next(ev.target['value'])
                }
            },
        } as AnyVirtualDOM
    }

    saveBtnView() {
        return {
            tag: 'i',
            class: 'fas fa-save text-success fv-pointer fv-hover-xx-lighter ml-1',
            onclick: () => this.text$.next(this.inputTagValue$.getValue()),
        } as AnyVirtualDOM
    }
}
