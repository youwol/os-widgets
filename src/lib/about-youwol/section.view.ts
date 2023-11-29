import { VirtualDOM, ChildrenLike, AnyVirtualDOM } from '@youwol/rx-vdom'

export class SectionTitle implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    public readonly title: string
    public readonly subtitle: string
    public readonly style = {
        width: 'fit-content',
    }
    constructor(params: { title: string; subtitle: string }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                innerText: this.title,
                style: {
                    fontSize: '1.7rem',
                    fontWeight: 'bolder',
                    width: 'fit-content',
                },
                children: [
                    {
                        style: {
                            fontSize: '1.5rem',
                            fontWeight: 'bolder',
                            width: 'fit-content',
                        },
                        tag: 'div',
                        innerText: this.subtitle,
                    },
                ],
            },
        ]
    }
}

export class SectionView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'mx-auto py-4 px-1'
    public readonly children: ChildrenLike

    constructor({
        title,
        subtitle,
        paragraphs,
        withClasses,
    }: {
        title: string | AnyVirtualDOM
        subtitle: string
        paragraphs: ChildrenLike
        withClasses: string
    }) {
        this.class += ' ' + withClasses
        this.children = [
            {
                tag: 'div',
                class: 'd-flex',
                children: [
                    {
                        tag: 'div',
                        class: 'rounded mr-1',
                        style: {
                            borderLeft: '10px solid #ffbb00',
                        },
                    },
                    typeof title === 'string'
                        ? new SectionTitle({
                              title,
                              subtitle,
                          })
                        : title,
                ],
            },
            { tag: 'div', class: 'my-4' },
            {
                tag: 'div',
                class: 'd-flex flex-column justify-content-around align-items-center',
                children: paragraphs,
            },
        ]
    }
}

export const textStyle = {
    fontSize: '16px',
    lineHeight: '32px',
    fontWeight: 400,
    textAlign: 'justify' as const,
}

export const paragraphStyle = {
    ...textStyle,
    minWidth: '300px',
    maxWidth: '600px',
}
export const maxColumnWidth = '1040px'

export class TextParagraphView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly style = paragraphStyle
    public readonly children: ChildrenLike

    constructor({ innerHTML }: { innerHTML: string }) {
        this.children = [
            {
                tag: 'div',
                innerHTML,
            },
        ]
    }
}

export class ParagraphSeparator implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'my-3'
}
