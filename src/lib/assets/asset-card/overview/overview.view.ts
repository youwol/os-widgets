import {
    ChildrenLike,
    AnyVirtualDOM,
    RxHTMLElement,
    VirtualDOM,
} from '@youwol/rx-vdom'
import { BehaviorSubject, combineLatest, Subject } from 'rxjs'
import { mergeMap, shareReplay, skip } from 'rxjs/operators'
import { AssetsBackend, AssetsGateway } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { AssetDescriptionView } from './description.view'
import { AssetScreenShotsView } from './screenshots.view'
import { AssetTagsView } from './tags.view'
import { AssetTitleView } from './title.view'

export class AssetOverview implements VirtualDOM<'div'> {
    static ClassSelector = 'asset-overview'
    public readonly tag = 'div'
    public readonly class = `${AssetOverview.ClassSelector} w-100 p-3 px-5 h-100 overflow-auto`
    public readonly children: ChildrenLike

    public readonly asset: AssetsBackend.GetAssetResponse
    public readonly permissions: AssetsBackend.GetPermissionsResponse

    public readonly name$: BehaviorSubject<string>
    public readonly tags$: BehaviorSubject<string[]>
    public readonly description$: BehaviorSubject<string>
    public readonly images$: BehaviorSubject<string[]>
    public readonly forceReadonly: boolean

    public readonly connectedCallback: (elem: RxHTMLElement<'div'>) => void

    public readonly assetOutput$: Subject<AssetsBackend.GetAssetResponse>

    public readonly assetsClient = new AssetsGateway.Client().assets
    public readonly click$ = new Subject<MouseEvent>()
    public readonly onclick = (event) => {
        this.click$.next(event)
    }

    constructor(params: {
        asset: AssetsBackend.GetAssetResponse
        permissions: AssetsBackend.GetPermissionsResponse
        withTabs?: { [key: string]: AnyVirtualDOM }
        forceReadonly?: boolean
        [key: string]: unknown
    }) {
        Object.assign(this, params)
        this.name$ = new BehaviorSubject(this.asset.name)
        this.tags$ = new BehaviorSubject(this.asset.tags)
        this.description$ = new BehaviorSubject(
            this.asset.description.trim() == ''
                ? 'No description has been provided yet.'
                : this.asset.description,
        )
        this.images$ = new BehaviorSubject(this.asset.images)

        const updatedAsset$ = combineLatest([
            this.name$,
            this.tags$,
            this.description$,
        ]).pipe(
            skip(1),
            mergeMap(([name, tags, description]) => {
                return this.assetsClient.updateAsset$({
                    assetId: this.asset.assetId,
                    body: {
                        name,
                        tags,
                        description,
                    },
                })
            }),
            raiseHTTPErrors(),
            shareReplay(1),
        )

        const screenShotsView = new AssetScreenShotsView({
            asset: this.asset,
            permissions: this.permissions,
            images$: this.images$,
            forceReadonly: this.forceReadonly,
        })

        this.children = [
            new AssetTitleView({
                name$: this.name$,
                asset: this.asset,
                permissions: this.permissions,
            }),
            new AssetTagsView({
                tags$: this.tags$,
                asset: this.asset,
                permissions: this.permissions,
                forceReadonly: this.forceReadonly,
            }),
            screenShotsView,
            new AssetDescriptionView({
                description$: this.description$,
                asset: this.asset,
                permissions: this.permissions,
                forceReadonly: this.forceReadonly,
                outsideClick$: this.click$,
                editionMode$: new BehaviorSubject<boolean>(false),
            }),
        ]
        this.connectedCallback = (elem) => {
            elem.ownSubscriptions(
                updatedAsset$.subscribe((asset) => {
                    this.assetOutput$ && this.assetOutput$.next(asset)
                }),
                screenShotsView.fileUploaded$
                    .pipe(
                        mergeMap(({ file }) => {
                            const id =
                                Math.floor(Math.random() * 1e5) +
                                '.' +
                                file.name.split('.').slice(-1)
                            return this.assetsClient.addImage$({
                                assetId: this.asset.assetId,
                                filename: id,
                                body: {
                                    content: file,
                                },
                            })
                        }),
                        raiseHTTPErrors(),
                    )
                    .subscribe((asset) => {
                        this.assetOutput$ && this.assetOutput$.next(asset)
                    }),
                screenShotsView.fileRemoved$
                    .pipe(
                        mergeMap(({ imageId }) =>
                            this.assetsClient.removeImage$({
                                assetId: this.asset.assetId,
                                filename: imageId,
                            }),
                        ),
                        raiseHTTPErrors(),
                    )
                    .subscribe((asset) => {
                        this.assetOutput$ && this.assetOutput$.next(asset)
                    }),
            )
        }
    }
}
