import { ChildrenLike, RxAttribute, VirtualDOM } from '@youwol/rx-vdom'
import { Observable } from 'rxjs'
import { AssetsBackend } from '@youwol/http-clients'

export interface AssetPresenterTrait {
    selectAsset: (assetId: string) => void
    selectedAsset$: Observable<string>
}

type AssetType = 'flux-project' | 'package' | 'story' | 'data'

const assetFaClasses: Record<AssetType, string> = {
    'flux-project': 'fas fa-play',
    package: 'fas fa-puzzle-piece',
    story: 'fas fa-book',
    data: 'fas fa-database',
}

/**
 *  # AssetCardView
 *
 * Card view of an asset.
 */
export class AssetSnippetView implements VirtualDOM<'div'> {
    static ClassSelector = 'asset-card-view'
    public readonly baseClasses = `${AssetSnippetView.ClassSelector} fv-bg-background d-flex overflow-hidden flex-column text-center rounded fv-pointer fv-color-primary fv-hover-color-focus position-relative my-2`
    public readonly tag = 'div'
    public readonly class: RxAttribute<string, string>
    public readonly style = { width: '250px', height: '250px' }

    public readonly children: ChildrenLike

    public readonly onclick: () => void

    public readonly asset: AssetsBackend.GetAssetResponse
    public readonly state: AssetPresenterTrait

    constructor(parameters: {
        asset: AssetsBackend.GetAssetResponse
        state: AssetPresenterTrait
    }) {
        Object.assign(this, parameters)

        this.class = {
            source$: this.state.selectedAsset$,
            vdomMap: (assetId) => {
                return this.asset.assetId == assetId
                    ? 'selected fv-bg-secondary fv-color-focus'
                    : ''
            },
            wrapper: (d) => `${d} ${this.baseClasses}`,
            untilFirst: this.baseClasses,
        }
        this.children = [
            {
                tag: 'div',
                class: 'border rounded fv-bg-primary position-absolute text-center',
                style: { width: '25px', height: '25px' },
                children: [
                    {
                        tag: 'i',
                        class: ` ${
                            assetFaClasses[this.asset.kind]
                        } fv-text-secondary w-100`,
                    },
                ],
            },
            this.asset.thumbnails[0]
                ? this.thumbnailView()
                : this.noThumbnailView(),
            this.ribbonView(),
        ]
        this.onclick = () => {
            this.state.selectAsset(this.asset.assetId)
        }
    }

    ribbonView(): VirtualDOM<'div'> {
        return {
            tag: 'div',
            class: 'py-3 fv-bg-background-alt position-absolute w-100 d-flex align-items-center justify-content-around',
            style: {
                bottom: '0px',
                background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,1))',
            },
            children: [
                {
                    tag: 'div',
                    innerText: this.asset.name,
                },
            ],
        }
    }

    thumbnailView(): VirtualDOM<'img'> {
        return {
            tag: 'img',
            class: 'p-1',
            src: this.asset.thumbnails[0],
            style: { marginTop: 'auto', marginBottom: 'auto' },
        }
    }

    noThumbnailView(): VirtualDOM<'div'> {
        return {
            tag: 'div',
            class: 'flex-grow-1',
            style: { minHeight: ' 0px' },
        }
    }
}
