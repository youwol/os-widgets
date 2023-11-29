import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import type { AssetLightDescription } from '@youwol/os-core'
import {
    AssetsBackend,
    AssetsGateway,
    FilesBackend,
} from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { BehaviorSubject, combineLatest, mergeMap, skip } from 'rxjs'

export class FileInfoView implements VirtualDOM<'div'> {
    static ClassSelector = 'file-info-view'
    public readonly tag = 'div'
    public readonly class = `${FileInfoView.ClassSelector} d-flex flex-column p-2 h-100`
    public readonly children: ChildrenLike
    public readonly asset: AssetsBackend.GetAssetResponse
    public readonly permissions: AssetsBackend.GetPermissionsResponse

    constructor(params: {
        asset: AssetLightDescription
        permissions: AssetsBackend.GetPermissionsResponse
    }) {
        Object.assign(this, params)
        this.children = [
            {
                source$: new AssetsGateway.Client().files
                    .getInfo$({ fileId: this.asset.rawId })
                    .pipe(raiseHTTPErrors()),
                vdomMap: (info: FilesBackend.GetInfoResponse) => {
                    return new MetadataView({
                        asset: this.asset,
                        metadata: info.metadata,
                        permissions: this.permissions,
                    })
                },
            },
        ]
    }
}

export class MetadataView implements VirtualDOM<'div'> {
    static ClassSelector = 'metadata-view'
    public readonly tag = 'div'
    public readonly class = `${FileInfoView.ClassSelector} d-flex flex-column p-2 h-100`
    public readonly asset: AssetsBackend.GetAssetResponse
    public readonly metadata: FilesBackend.Metadata
    public readonly permissions: AssetsBackend.GetPermissionsResponse
    public readonly children: ChildrenLike

    constructor(params: {
        asset: AssetsBackend.GetAssetResponse
        metadata: FilesBackend.Metadata
        permissions: AssetsBackend.GetPermissionsResponse
    }) {
        Object.assign(this, params)

        const contentType$ = new BehaviorSubject(this.metadata.contentType)
        const contentEncoding$ = new BehaviorSubject(
            this.metadata.contentEncoding,
        )
        combineLatest([contentEncoding$, contentType$])
            .pipe(
                skip(1),
                mergeMap(([contentEncoding, contentType]) => {
                    return new AssetsGateway.Client().files.updateMetadata$({
                        fileId: this.asset.rawId,
                        body: {
                            contentEncoding,
                            contentType,
                        },
                    })
                }),
            )
            .subscribe()

        const contentTypeView = new MetadataFieldEditable({
            label: 'content-type',
            values: [
                'text/plain',
                'text/html',
                'text/css',
                'text/javascript',
                'image/gif',
                'image/png',
                'image/jpeg',
                'image/bmp',
                'image/webp',
                'application/octet-stream',
                'application/pkcs12',
                'application/vnd.mspowerpoint',
                'application/xhtml+xml',
                'application/xml',
                'application/pdf',
                'audio/midi',
                'audio/mpeg',
                'audio/webm',
                'audio/ogg',
                'audio/wav',
                'video/webm',
                'video/ogg',
            ],
            value$: contentType$,
            permissions: this.permissions,
        })

        const contentEncodingView = new MetadataFieldEditable({
            label: 'content-encoding',
            value$: contentEncoding$,
            values: ['identity', 'gzip', 'br', 'deflate'],
            permissions: this.permissions,
        })

        this.children = [
            contentTypeView,
            { tag: 'div', class: 'my-1' },
            contentEncodingView,
            { tag: 'div', class: 'my-2' },
        ]
    }
}

export class MetadataFieldEditable implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    public readonly label: string
    public readonly permissions: AssetsBackend.GetPermissionsResponse
    public readonly value$: BehaviorSubject<string>
    public readonly values: string[]
    constructor(params: {
        label: string
        permissions: AssetsBackend.GetPermissionsResponse
        value$: BehaviorSubject<string>
        values: string[]
    }) {
        Object.assign(this, params)
        this.children = [
            { tag: 'div', innerText: this.label },
            this.permissions.write
                ? {
                      tag: 'select',
                      value: this.value$.getValue(),
                      onchange: (ev) => {
                          const option = Array.from(
                              ev.target as unknown as { selected: boolean }[],
                          ).find((optionElem) => optionElem.selected)
                          this.value$.next(option['value'])
                      },
                      children: this.values.map((value) => {
                          return {
                              tag: 'option',
                              innerText: value,
                              selected: value == this.value$.getValue(),
                          }
                      }),
                  }
                : { tag: 'div', innerText: this.value$.getValue() },
        ]
    }
}
