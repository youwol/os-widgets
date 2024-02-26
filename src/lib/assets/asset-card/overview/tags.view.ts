import { ChildrenLike, RxHTMLElement, VirtualDOM } from '@youwol/rx-vdom'
import { BehaviorSubject, Observable, of } from 'rxjs'
import { skip } from 'rxjs/operators'
import { IconButtonView, TextEditableView } from '../misc.view'
import { AssetsBackend } from '@youwol/http-clients'

export class AssetTagsView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static ClassSelector = 'asset-tags-view'

    public readonly class = `${AssetTagsView.ClassSelector} w-100 d-flex justify-content-center`
    public readonly style = {
        position: 'relative' as const,
    }

    public readonly asset: AssetsBackend.GetAssetResponse
    public readonly permissions: AssetsBackend.GetPermissionsResponse

    public readonly children: ChildrenLike
    public readonly tags$: BehaviorSubject<string[]>
    public readonly forceReadonly: boolean

    constructor(params: {
        tags$: BehaviorSubject<string[]>
        asset: AssetsBackend.GetAssetResponse
        permissions: AssetsBackend.GetPermissionsResponse
        forceReadonly?: boolean
    }) {
        Object.assign(this, params)
        this.children = [
            this.permissions.write && !this.forceReadonly
                ? new TagsEditableView({ tags$: this.tags$ })
                : AssetTagsView.readOnlyView(this.tags$),
            {
                source$: this.tags$,
                vdomMap: (tags: string[]) =>
                    tags.length == 0
                        ? {
                              tag: 'div',
                              style: {
                                  fontStyle: 'italic',
                              },
                              innerText: 'No tag has been provided yet.',
                          }
                        : { tag: 'div' },
            },
        ]
    }

    static readOnlyView(tags$: BehaviorSubject<string[]>): VirtualDOM<'div'> {
        return {
            tag: 'div',
            class: 'd-flex flex-wrap align-items-center',
            children: {
                policy: 'replace',
                source$: tags$,
                vdomMap: (tags: string[]) =>
                    tags.map((tag) => AssetTagsView.tagView(of(tag))),
            },
        }
    }

    static tagView(tag$: Observable<string>): VirtualDOM<'div'> {
        return {
            tag: 'div',
            class: 'border rounded p-2 mx-2',
            innerText: { source$: tag$, vdomMap: (tag: string) => tag },
        }
    }
}

class TagsEditableView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static ClassSelector = 'tags-editable-view w-100'
    public readonly class = `${TagsEditableView.ClassSelector}`
    public readonly children: ChildrenLike

    public readonly tags$: BehaviorSubject<string[]>

    constructor(params: { tags$: BehaviorSubject<string[]> }) {
        Object.assign(this, params)

        this.children = [
            new IconButtonView({
                onclick: () =>
                    this.tags$.next([...this.tags$.getValue(), 'new tag']),
                icon: 'fa-tag',
                withClasses:
                    'btn btn-outline-secondary justify-content-end p-1 mt-2',
                setChildren: [
                    {
                        tag: 'i',
                        class: 'fas fa-plus ml-2',
                    },
                ],
            }),
            {
                tag: 'div',
                class: 'd-flex align-items-center  flex-wrap flex-row',
                children: {
                    policy: 'replace',
                    source$: this.tags$,
                    vdomMap: (tags: string[]) => {
                        return [
                            ...tags.map(
                                (tag, i) =>
                                    new EditableTagView({
                                        tags$: this.tags$,
                                        index: i,
                                    }),
                            ),
                        ]
                    },
                },
            },
        ]
    }
}

class EditableTagView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex align-items-center'
    public readonly style = {
        fontWeight: 'bolder' as const,
    }
    public readonly children: ChildrenLike

    public readonly tags$: BehaviorSubject<string[]>
    public readonly index: number

    connectedCallback: (elem: RxHTMLElement<'div'>) => void

    constructor(params: { index: number; tags$: BehaviorSubject<string[]> }) {
        Object.assign(this, params)
        const text$ = new BehaviorSubject(this.tags$.getValue()[this.index])

        this.children = [
            {
                source$: this.tags$,
                vdomMap: () => ({
                    tag: 'div',
                    class: 'd-flex align-items-center m-2',
                    children: [
                        new TextEditableView({
                            text$,
                            regularView: (innerText$) => ({
                                tag: 'div',
                                innerText: {
                                    source$: innerText$,
                                    vdomMap: (t: string) => t,
                                },
                            }),
                            class: 'border rounded p-1 d-flex align-items-center',
                        }),
                        {
                            tag: 'i',
                            style: { height: 'fit-content' },
                            class: 'fas fa-times mx-1 fv-text-error fv-pointer fv-hover-xx-lighter',
                            onclick: () => {
                                const newTags = this.tags$
                                    .getValue()
                                    .filter((_, i) => i != this.index)
                                this.tags$.next(newTags)
                            },
                        },
                    ],
                }),
            },
        ]
        this.connectedCallback = (elem) => {
            elem.ownSubscriptions(
                text$.pipe(skip(1)).subscribe((text) => {
                    const newTags = this.tags$.getValue()
                    newTags[this.index] = text
                    this.tags$.next(newTags)
                }),
            )
        }
    }
}
