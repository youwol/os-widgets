import {
    AnyVirtualDOM,
    ChildrenLike,
    RxHTMLElement,
    VirtualDOM,
} from '@youwol/rx-vdom'
import { Select } from '@youwol/rx-input-views'
import { AssetsBackend, AssetsGateway } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { BehaviorSubject, combineLatest, Subject } from 'rxjs'
import { distinct, map, skip } from 'rxjs/operators'

export class ExposedGroupState {
    public readonly groupName: string
    public readonly groupId: string
    public readonly asset: AssetsBackend.GetAssetResponse
    public readonly permissions: AssetsBackend.GetPermissionsResponse
    public readonly data: AssetsBackend.ExposingGroup
    public readonly groupAccess$: BehaviorSubject<AssetsBackend.ExposingGroup>
    public readonly loading$ = new BehaviorSubject<boolean>(false)
    public readonly client = new AssetsGateway.Client().assets

    constructor(params: {
        asset: AssetsBackend.GetAssetResponse
        permissions: AssetsBackend.GetPermissionsResponse
        data: AssetsBackend.ExposingGroup
    }) {
        Object.assign(this, params)
        this.groupId = this.data.groupId
        this.groupName = this.data.name
        this.groupAccess$ = new BehaviorSubject<AssetsBackend.ExposingGroup>(
            this.data,
        )
    }

    update(body: AssetsBackend.UpsertAccessPolicyBody) {
        this.loading$.next(true)
        this.client
            .upsertAccessPolicy$({
                assetId: this.asset.assetId,
                groupId: this.groupId,
                body,
            })
            // XXX:  Why groupAccess is not used ?
            .subscribe((_groupAccess) => {
                this.loading$.next(false)
            })
    }

    refresh() {
        this.loading$.next(true)
        new AssetsGateway.Client().assets
            .queryAccessInfo$({ assetId: this.asset.assetId })
            .pipe(raiseHTTPErrors())
            .subscribe((info) => {
                const groupAccess =
                    this.groupId == '*'
                        ? info.ownerInfo.defaultAccess
                        : info.ownerInfo.exposingGroups.find(
                              (g) => g.groupId == this.groupId,
                          )

                this.groupAccess$.next({
                    name: this.groupName,
                    groupId: this.groupId,
                    access: groupAccess,
                } as AssetsBackend.ExposingGroup)
                this.loading$.next(false)
            })
    }
}

export class ExposedGroupView implements VirtualDOM<'div'> {
    static ClassSelector = 'exposed-group-view'
    public readonly tag = 'div'
    public readonly class = `${ExposedGroupView.ClassSelector} w-100 my-3`

    public readonly children: ChildrenLike
    public readonly connectedCallback: (elem: RxHTMLElement<'div'>) => void

    constructor(state: ExposedGroupState) {
        class Item extends Select.ItemData {
            constructor(
                id,
                name,
                public readonly expiration,
            ) {
                super(id, name)
            }
        }
        const optionsRead = [
            new Item('forbidden', 'Forbidden', null),
            new Item('authorized', 'Authorized', null),
            new Item('expiration-date', 'Expiration-date', Date.now()),
        ]

        const selectStateRead = new Select.State(
            optionsRead,
            state.data.access.read,
        )
        const valueViewRead = state.permissions.write
            ? new Select.View({ state: selectStateRead })
            : { tag: 'div', innerText: `${state.data.access.read}` }

        const optionsShare = [
            new Item('forbidden', 'Forbidden', null),
            new Item('authorized', 'Authorized', null),
        ]

        const selectStateShare = new Select.State(
            optionsShare,
            state.data.access.share,
        )
        const valueViewShare = state.permissions.write
            ? new Select.View({ state: selectStateShare })
            : { innerText: state.data.access.share }

        const parameters$ = new BehaviorSubject<{ [k: string]: unknown }>({})

        const bodyPost$ = combineLatest([
            state.groupAccess$.pipe(map((a) => a.access)),
            selectStateRead.selection$.pipe(distinct()),
            selectStateShare.selection$.pipe(distinct()),
            parameters$.pipe(distinct()),
        ]).pipe(
            skip(1),
            map(([initial, read, share, parameters]) => {
                return {
                    ...initial,
                    ...{ read: read.id },
                    ...{ share: share.id },
                    ...{ parameters },
                }
            }),
        )

        const factory = {
            'expiration-date': expirationDateAccessView,
        }
        this.children = [
            state.groupName == '*'
                ? undefined
                : {
                      tag: 'div',
                      class: 'mx-auto border-bottom',
                      style: {
                          width: 'fit-content',
                      },
                      children: [
                          { tag: 'i', class: 'fas fa-users mx-2' },
                          { tag: 'i', innerText: state.groupName },
                      ],
                  },
            {
                tag: 'div',
                class: 'd-flex justify-content-around',
                children: [
                    {
                        tag: 'div',
                        class: 'd-flex flex-column align-items-center',
                        children: [
                            {
                                tag: 'div',
                                innerText: 'read',
                                class: 'px-2',
                                style: { fontWeight: 'bolder' },
                            },
                            valueViewRead as AnyVirtualDOM,
                        ],
                    },
                    {
                        tag: 'div',
                        class: 'd-flex flex-column align-items-center',
                        children: [
                            {
                                tag: 'div',
                                innerText: 'share',
                                class: 'px-2',
                                style: { fontWeight: 'bolder' },
                            },
                            valueViewShare as AnyVirtualDOM,
                        ],
                    },
                ],
            },
            {
                source$: bodyPost$,
                vdomMap: (access) => {
                    return factory[access['read']]
                        ? factory[access['read']](access, parameters$)
                        : {}
                },
            },
        ]
        this.connectedCallback = (elem) => {
            elem.ownSubscriptions(
                bodyPost$.subscribe((body) =>
                    state.update(body as AssetsBackend.UpsertAccessPolicyBody),
                ),
            )
        }
    }
}

function expirationDateAccessView(
    access: AssetsBackend.GroupAccess,
    parameters$: Subject<{ [k: string]: unknown }>,
) {
    const edition$ = new BehaviorSubject<boolean>(false)
    return {
        tag: 'div',
        class: 'd-flex align-items-center py-2',
        children: [
            { tag: 'div', innerText: 'expiration-date:', class: 'px-2' },
            {
                source$: edition$,
                vdomMap: (editing) => {
                    return editing
                        ? {
                              tag: 'input',
                              type: 'date',
                              value: access.parameters.expiration,
                              onchange: (ev) => {
                                  const period =
                                      (ev.target.valueAsNumber - Date.now()) /
                                      1000
                                  parameters$.next({
                                      period,
                                      expiration: ev.target.value,
                                  })
                                  edition$.next(false)
                              },
                          }
                        : {
                              innerText: access.expiration,
                              ondblclick: () => edition$.next(true),
                          }
                },
            },
        ],
    }
}
