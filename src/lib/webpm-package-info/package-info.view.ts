import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AssetsGateway, CdnBackend } from '@youwol/http-clients'
import { raiseHTTPErrors, onHTTPErrors } from '@youwol/http-primitives'
import { BehaviorSubject, combineLatest, Observable } from 'rxjs'
import {
    distinctUntilChanged,
    filter,
    map,
    mergeMap,
    share,
    shareReplay,
    tap,
} from 'rxjs/operators'
import { getUrlBase } from '@youwol/cdn-client'
import { Select } from '@youwol/rx-input-views'
import { ExplorerView } from './package-explorer.view'
import { AssetLightDescription } from '@youwol/os-core'

type MetadataResponse = CdnBackend.GetLibraryInfoResponse

export class PackageVersionSelect implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static ClassSelector = 'package-version-select'
    public readonly class = `${PackageVersionSelect.ClassSelector} d-flex align-items-center mx-2`
    public readonly children: ChildrenLike
    public readonly state: PackageInfoState

    constructor(params: { state: PackageInfoState }) {
        Object.assign(this, params)
        const itemsData$ = this.state.metadata$.pipe(
            map((metadata) => {
                return metadata.versions.map((v) => new Select.ItemData(v, v))
            }),
        )
        const selectState = new Select.State(
            itemsData$,
            this.state.selectedVersion$,
        )
        this.children = [
            { tag: 'div', innerText: 'Versions:', class: 'px-2' },
            new Select.View({ state: selectState }),
        ]
    }
}

export class PackageLinkSelect implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static ClassSelector = 'package-link-select'
    public readonly class = `${PackageLinkSelect.ClassSelector} d-flex align-items-center mx-2`
    public readonly children: ChildrenLike
    public readonly state: PackageInfoState

    constructor(params: { state: PackageInfoState }) {
        Object.assign(this, params)
        const itemsData$ = this.state.links$.pipe(
            map((links) => {
                return links.map((l) => new Select.ItemData(l.url, l.name))
            }),
        )
        const selectState = new Select.State(
            itemsData$,
            this.state.selectedLink$,
        )
        this.children = [
            { tag: 'div', innerText: 'Reports:', class: 'px-2' },
            new Select.View({ state: selectState }),
        ]
    }
}

export class PackageInfoHeader implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static ClassSelector = 'package-info-header'
    public readonly class = `${PackageInfoHeader.ClassSelector} d-flex w-100 justify-content-center`
    public readonly children: ChildrenLike
    public readonly state: PackageInfoState

    constructor(params: { state: PackageInfoState }) {
        Object.assign(this, params)
        this.children = [
            new PackageVersionSelect({
                state: this.state,
            }),
            new PackageLinkSelect({
                state: this.state,
            }),
        ]
    }
}

interface Link {
    name: string
    version: string
    url: string
}

export class PackageInfoState implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static nativeExplorerId = 'native-explorer'

    public readonly asset: AssetLightDescription
    public readonly metadata$: Observable<MetadataResponse>
    public readonly selectedVersion$ = new BehaviorSubject<string>(undefined)
    public readonly links$: Observable<Link[]>
    public readonly selectedLink$ = new BehaviorSubject<string>(
        PackageInfoState.nativeExplorerId,
    )
    public readonly client = new AssetsGateway.Client().cdn

    constructor(params: { asset: AssetLightDescription }) {
        Object.assign(this, params)

        this.metadata$ = this.client
            .getLibraryInfo$({ libraryId: this.asset.rawId })
            .pipe(
                raiseHTTPErrors(),
                tap((metadata) => {
                    this.selectedVersion$.next(metadata.versions[0])
                }),
                shareReplay(1),
            )

        this.links$ = this.selectedVersion$.pipe(
            filter((v) => v != undefined),
            distinctUntilChanged(),
            mergeMap((version) => {
                return this.client
                    .getResource$({
                        libraryId: this.asset.rawId,
                        version,
                        restOfPath: '.yw_metadata.json',
                    })
                    .pipe(
                        onHTTPErrors((error) => {
                            if (error.status == 404) {
                                return { links: [] }
                            }
                            throw error
                        }),
                        map(({ links }: { links: { name; url }[] }) => {
                            return links
                                ? links.map((l) => ({ ...l, version }))
                                : []
                        }),
                        map((links) => {
                            return [
                                {
                                    name: 'Explorer',
                                    url: PackageInfoState.nativeExplorerId,
                                    version,
                                },
                                ...links,
                            ]
                        }),
                    )
            }),
            tap(() => {
                this.selectedLink$.next(PackageInfoState.nativeExplorerId)
            }),
            share(),
        )
    }
}

export class PackageInfoContent implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static ClassSelector = 'package-info-content'
    public readonly class = `${PackageInfoHeader.ClassSelector} flex-grow-1 w-100`
    public readonly children: ChildrenLike
    public readonly state: PackageInfoState

    constructor(params: { state: PackageInfoState }) {
        Object.assign(this, params)
        this.children = [
            {
                source$: combineLatest([
                    this.state.selectedLink$.pipe(
                        filter((l) => l != undefined),
                    ),
                    this.state.links$,
                ]),
                vdomMap: ([url, links]) => {
                    const link = links.find((l) => l.url == url)
                    if (url == PackageInfoState.nativeExplorerId) {
                        return new ExplorerView({
                            asset: this.state.asset,
                            version: link.version,
                        })
                    }
                    return {
                        tag: 'iframe',
                        class: 'h-100 w-100',
                        style: {
                            backgroundColor: 'white',
                        },
                        src: `${getUrlBase(
                            this.state.asset.name,
                            link.version,
                        )}/${link.url}`,
                    }
                },
            },
        ]
    }
}

export class PackageInfoView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    static ClassSelector = 'package-info-view'
    public readonly class = `${PackageInfoView.ClassSelector} d-flex flex-column p-2 h-100`
    public readonly children: ChildrenLike
    public readonly asset: AssetLightDescription
    public readonly state: PackageInfoState

    constructor(params: { asset: AssetLightDescription }) {
        Object.assign(this, params)
        this.state = new PackageInfoState({ asset: this.asset })

        this.children = [
            new PackageInfoHeader({
                state: this.state,
            }),
            new PackageInfoContent({
                state: this.state,
            }),
        ]
    }
}
