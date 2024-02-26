import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Observable, ReplaySubject } from 'rxjs'

import { AssetsBackend } from '@youwol/http-clients'
import { AssetPresenterTrait, AssetSnippetView } from './asset-snippet.view'

/**
 * # AssetsListView
 */
export class AssetsListView implements VirtualDOM<'div'> {
    static ClassSelector = 'assets-list-view'
    public readonly tag = 'div'
    public readonly class = `${AssetsListView.ClassSelector} h-100 overflow-auto w-100`
    public readonly style = { minHeight: '0px' }
    public readonly children: ChildrenLike

    public readonly assets$: Observable<AssetsBackend.GetAssetResponse[]>
    public readonly state: AssetPresenterTrait

    constructor(parameters: {
        assets$: Observable<AssetsBackend.GetAssetResponse[]>
        state: AssetPresenterTrait
    }) {
        Object.assign(this, parameters)

        const elementInDoc$ = new ReplaySubject(1)
        this.children = [
            {
                tag: 'div',
                class: 'w-100 d-flex flex-wrap justify-content-around ',
                children: {
                    policy: 'append',
                    source$: this.assets$,
                    vdomMap: (asset: AssetsBackend.GetAssetResponse) =>
                        new AssetSnippetView({ asset, state: this.state }),
                    sideEffects: () => elementInDoc$.next(true),
                },
            },
            {
                source$: elementInDoc$,
                vdomMap: () => ({ tag: 'div' }),
                untilFirst: {
                    tag: 'div',
                    class: 'd-flex flex-column justify-content-center h-100',
                    children: [{ tag: 'div', class: 'fas fa-spinner fa-spin' }],
                },
            },
        ]
    }
}
