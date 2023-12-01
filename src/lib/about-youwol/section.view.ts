import { VirtualDOM, ChildrenLike, AnyVirtualDOM } from '@youwol/rx-vdom'

export const backgroundImage = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.dev/svgjs' width='100%' height='100%' preserveAspectRatio='none' viewBox='0 0 1440 560'%3e%3cg mask='url(%26quot%3b%23SvgjsMask1040%26quot%3b)' fill='none'%3e%3crect width='1440' height='560' x='0' y='0' fill='url(%26quot%3b%23SvgjsLinearGradient1041%26quot%3b)'%3e%3c/rect%3e%3cpath d='M1440 0L945.37 0L1440 20.24z' fill='rgba(255%2c 255%2c 255%2c .1)'%3e%3c/path%3e%3cpath d='M945.37 0L1440 20.24L1440 159.82000000000002L847.7 0z' fill='rgba(255%2c 255%2c 255%2c .075)'%3e%3c/path%3e%3cpath d='M847.7 0L1440 159.82000000000002L1440 265.26L772.9000000000001 0z' fill='rgba(255%2c 255%2c 255%2c .05)'%3e%3c/path%3e%3cpath d='M772.9000000000001 0L1440 265.26L1440 319.48L326.2100000000001 0z' fill='rgba(255%2c 255%2c 255%2c .025)'%3e%3c/path%3e%3cpath d='M0 560L403.63 560L0 499.4z' fill='rgba(0%2c 0%2c 0%2c .1)'%3e%3c/path%3e%3cpath d='M0 499.4L403.63 560L637.6 560L0 333.98z' fill='rgba(0%2c 0%2c 0%2c .075)'%3e%3c/path%3e%3cpath d='M0 333.98L637.6 560L790.46 560L0 239.65000000000003z' fill='rgba(0%2c 0%2c 0%2c .05)'%3e%3c/path%3e%3cpath d='M0 239.65000000000003L790.46 560L893.24 560L0 146.92000000000002z' fill='rgba(0%2c 0%2c 0%2c .025)'%3e%3c/path%3e%3c/g%3e%3cdefs%3e%3cmask id='SvgjsMask1040'%3e%3crect width='1440' height='560' fill='white'%3e%3c/rect%3e%3c/mask%3e%3clinearGradient x1='15.28%25' y1='-39.29%25' x2='84.72%25' y2='139.29%25' gradientUnits='userSpaceOnUse' id='SvgjsLinearGradient1041'%3e%3cstop stop-color='%230e2a47' offset='0'%3e%3c/stop%3e%3cstop stop-color='rgba(1%2c 32%2c 73%2c 1)' offset='1'%3e%3c/stop%3e%3c/linearGradient%3e%3c/defs%3e%3c/svg%3e")`

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
