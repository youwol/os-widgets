import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Button } from '@youwol/rx-button-views'
import { BehaviorSubject } from 'rxjs'

export class ButtonView extends Button.View {
    class = 'fv-btn fv-bg-secondary-alt fv-hover-bg-secondary'

    constructor({
        name,
        withClass,
        enabled,
    }: {
        name: string
        withClass: string
        enabled: boolean
    }) {
        super({
            state: new Button.State(),
            contentView: () => ({ tag: 'div', innerText: name }),
            disabled: !enabled,
        })
        this.class = `${this.class} ${withClass}`
    }
}

export class ImagesCarouselView implements VirtualDOM<'div'> {
    static ClassSelector = 'images-carousel-view'
    public readonly tag = 'div'
    public class: string
    public readonly style: Record<string, string>

    public readonly children: ChildrenLike
    public readonly selectedSnippet$ = new BehaviorSubject(0)
    public readonly imagesURL: string[]

    constructor(parameters: { imagesURL: string[]; class; style }) {
        Object.assign(this, parameters)
        this.class = `${ImagesCarouselView.ClassSelector} ${this.class}`
        this.children = [
            {
                source$: this.selectedSnippet$,
                vdomMap: (index) =>
                    this.handleView(index, 'fa-chevron-left ml-auto', -1),
            },
            {
                source$: this.selectedSnippet$,
                vdomMap: (index: number) => ({
                    class: 'px-2 w-100 h-100',
                    tag: 'img',
                    style: {
                        height: 'auto',
                    },
                    src: this.imagesURL[index],
                }),
            },
            {
                source$: this.selectedSnippet$,
                vdomMap: (index) =>
                    this.handleView(index, 'fa-chevron-right mr-auto', 1),
            },
        ]
    }

    handleView(index, icon, increment): VirtualDOM<'div'> {
        return (increment == -1 && index > 0) ||
            (increment == 1 && index < this.imagesURL.length - 1)
            ? {
                  tag: 'div',
                  class: `fas ${icon} my-auto fa-2x fv-pointer fv-text-primary fv-hover-text-focus handle-${
                      increment > 0 ? 'next' : 'previous'
                  }`,
                  onclick: () =>
                      this.selectedSnippet$.next(
                          this.selectedSnippet$.getValue() + increment,
                      ),
              }
            : {
                  tag: 'div',
                  class:
                      increment > 0
                          ? 'handle-right-none mr-auto'
                          : 'handle-left-none ml-auto',
              }
    }
}
