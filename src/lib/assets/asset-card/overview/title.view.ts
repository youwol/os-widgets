import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { BehaviorSubject } from 'rxjs'
import { AssetsBackend } from '@youwol/http-clients'

export class AssetTitleView implements VirtualDOM<'div'> {
    static ClassSelector = 'asset-title-view'

    public readonly tag: 'div'
    public readonly class = `${AssetTitleView.ClassSelector} w-100`
    public readonly asset: AssetsBackend.GetAssetResponse
    public readonly permissions: AssetsBackend.GetPermissionsResponse
    public readonly children: ChildrenLike
    public readonly name$: BehaviorSubject<string>
    public readonly forceReadonly: boolean

    constructor(params: {
        name$: BehaviorSubject<string>
        asset: AssetsBackend.GetAssetResponse
        permissions: AssetsBackend.GetPermissionsResponse
    }) {
        Object.assign(this, params)

        this.children = [this.readOnlyView(this.name$)]
    }

    readOnlyView(name$: BehaviorSubject<string>): VirtualDOM<'h1'> {
        return {
            tag: 'h1',
            class: 'text-center',
            style: {
                fontWeight: 'bolder',
            },
            innerText: {
                source$: name$,
                vdomMap: (name: string) => name,
            },
            children: [
                this.permissions.write
                    ? { tag: 'div' }
                    : { tag: 'div', class: 'fas fa-lock ml-3' },
            ],
        }
    }
}
