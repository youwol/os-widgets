import { install, LoadingScreenView } from '@youwol/webpm-client'
import { ChildrenLike, RxHTMLElement, VirtualDOM } from '@youwol/rx-vdom'
import { BehaviorSubject, from, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { AssetsBackend } from '@youwol/http-clients'
import { parse } from 'marked'

export class AssetDescriptionView implements VirtualDOM<'div'> {
    static ClassSelector = 'asset-description-view'
    public readonly tag = 'div'
    public readonly class = `${AssetDescriptionView.ClassSelector} w-100 border rounded`
    public readonly style = {
        position: 'relative' as const,
    }
    public readonly children: ChildrenLike
    public readonly description$: BehaviorSubject<string>
    public readonly asset: AssetsBackend.GetAssetResponse
    public readonly permissions: AssetsBackend.GetPermissionsResponse
    public readonly forceReadonly: boolean
    public readonly onclick = (event) => {
        event.stopPropagation()
    }

    constructor(params: {
        description$: BehaviorSubject<string>
        asset: AssetsBackend.GetAssetResponse
        permissions: AssetsBackend.GetPermissionsResponse
        outsideClick$: Observable<MouseEvent>
        editionMode$: BehaviorSubject<boolean>
        forceReadonly?: boolean
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: 'fv-bg-background fv-xx-lighter h-100 w-100',
                style: {
                    opacity: '0.5',
                    position: 'absolute' as const,
                    zIndex: -1,
                },
            },
            this.permissions.write && !this.forceReadonly
                ? new DescriptionEditableView({
                      description$: this.description$,
                      outsideClick$: params.outsideClick$,
                      editionMode$: params.editionMode$,
                  })
                : AssetDescriptionView.readOnlyView(this.description$),
        ]
    }

    static readOnlyView(
        description$: BehaviorSubject<string>,
        params: { [k: string]: unknown } = {},
    ): VirtualDOM<'div'> {
        return {
            tag: 'div',
            class: 'p-2',
            children: [
                {
                    tag: 'div',
                    innerHTML: {
                        source$: description$,
                        vdomMap: (d) => parse(d),
                    },
                    ...params,
                },
            ],
        }
    }
}

function fetchDependencies$(
    loadingScreenContainer: HTMLDivElement,
): Observable<WindowOrWorkerGlobalScope> {
    const loadingScreen = new LoadingScreenView({
        container: loadingScreenContainer,
        logo: `<div style='font-size:x-large'>Markdown</div>`,
        wrapperStyle: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            'font-weight': 'bolder',
        },
    })
    loadingScreen.render()

    return from(
        install({
            modules: ['codemirror'],
            scripts: [
                'codemirror#5.52.0~mode/javascript.min.js',
                'codemirror#5.52.0~mode/markdown.min.js',
                'codemirror#5.52.0~mode/css.min.js',
                'codemirror#5.52.0~mode/xml.min.js',
                'codemirror#5.52.0~mode/htmlmixed.min.js',
                'codemirror#5.52.0~mode/gfm.min.js',
            ],
            css: [
                'codemirror#5.52.0~codemirror.min.css',
                'codemirror#5.52.0~theme/blackboard.min.css',
            ],
            onEvent: (ev) => {
                loadingScreen.next(ev)
            },
        }),
    ).pipe(
        tap(() => {
            loadingScreen.done()
        }),
    )
}

class DescriptionEditableView implements VirtualDOM<'div'> {
    static ClassSelector = 'description-editable-view'
    public readonly tag = 'div'
    public readonly style = {
        position: 'relative' as const,
    }
    public readonly class = `${DescriptionEditableView.ClassSelector} `
    public readonly children: ChildrenLike
    public readonly editionMode$ = new BehaviorSubject(false)

    public readonly description$: BehaviorSubject<string>

    public readonly outsideClick$: Observable<MouseEvent>

    public readonly configurationCodeMirror = {
        value: '',
        mode: 'markdown',
        lineNumbers: false,
        theme: 'blackboard',
        lineWrapping: true,
        indentUnit: 4,
    }
    editor

    constructor(params: {
        description$: BehaviorSubject<string>
        outsideClick$: Observable<MouseEvent>
        editionMode$: BehaviorSubject<boolean>
    }) {
        Object.assign(this, params)
        // const editBtnViews = {
        //     tag: 'div',
        //     clss: 'btn',
        //     style: {
        //         position: 'absolute',
        //         right: '0',
        //         top: '-10px',
        //     },
        //     onclick: () => this.editionMode$.next(true),
        // }

        this.children = [
            {
                source$: this.editionMode$ /*.pipe(
                    mergeMap((editionMode) =>
                        editionMode
                            ? fetchDependencies$().pipe(mapTo(editionMode))
                            : of(editionMode),
                    ),
                )*/,
                vdomMap: (editionMode: boolean) => {
                    return editionMode
                        ? {
                              tag: 'div',
                              class: 'w-100',
                              style: {
                                  height: '300px',
                              },
                              connectedCallback: (
                                  elem: RxHTMLElement<'div'>,
                              ) => {
                                  fetchDependencies$(elem).subscribe(() => {
                                      const config = {
                                          ...this.configurationCodeMirror,
                                          value: this.description$.getValue(),
                                      }
                                      this.editor = window['CodeMirror'](
                                          elem,
                                          config,
                                      )
                                  })
                                  elem.ownSubscriptions(
                                      this.outsideClick$.subscribe(() => {
                                          this.editionMode$.next(false)
                                          this.description$.next(
                                              this.editor.getValue(),
                                          )
                                      }),
                                  )
                              },
                          }
                        : AssetDescriptionView.readOnlyView(this.description$)
                },
            },
        ]
    }
}
