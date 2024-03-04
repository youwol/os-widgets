import { ImmutableTree } from '@youwol/rx-tree-views'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { ExplorerBackend } from '@youwol/http-clients'
import { RequestEvent } from '@youwol/http-primitives'
import { v4 as uuidv4 } from 'uuid'
import { RequestsExecutor } from '@youwol/os-core'
type NodeEventType = 'item-added'

export interface Origin {
    local: boolean
    remote: boolean
}
type Children = BrowserNode[] | Observable<BrowserNode[]>

export class BrowserNode extends ImmutableTree.Node {
    public readonly name: string
    public readonly events$ = new Subject<{ type: NodeEventType }>()
    public readonly status$ = new BehaviorSubject<
        Array<{ type: string; id: string }>
    >([])
    public readonly icon: string

    public readonly origin?: Origin

    constructor(params: {
        id: string
        name: string
        icon?: string
        children?: Children
        origin?: Origin
    }) {
        super(params)
        Object.assign(this, params)
    }

    addStatus({ type, id }: { type: string; id?: string }) {
        id = id || this.id
        const newStatus = this.status$.getValue().concat({ type, id })
        this.status$.next(newStatus)
        return { type, id }
    }

    removeStatus({ type, id }: { type: string; id?: string }) {
        id = id || this.id
        const newStatus = this.status$
            .getValue()
            .filter((s) => s.type != type && s.id != id)
        this.status$.next(newStatus)
    }
    resolveChildren(): Observable<Array<BrowserNode>> {
        if (!this.children) {
            return
        }

        const uid = uuidv4()
        this.addStatus({ type: 'request-pending', id: uid })
        return super.resolveChildren().pipe(
            tap(() => {
                this.removeStatus({ type: 'request-pending', id: uid })
            }),
        ) as Observable<Array<BrowserNode>>
    }
}

export function serialize(node: BrowserNode) {
    return JSON.stringify({
        id: node.id,
        name: node.name,
        origin: node.origin,
        icon: node.icon,
        children: Array.isArray(node.children)
            ? node.children.map((n) => serialize(n as BrowserNode))
            : [],
    })
}

type GroupKind = 'user' | 'users'

export class GroupNode extends BrowserNode {
    static iconsFactory: Record<GroupKind, string> = {
        user: 'fas fa-user',
        users: 'fas fa-users',
    }

    public readonly groupId: string
    public readonly kind: GroupKind

    constructor(params: {
        id: string
        name: string
        kind: GroupKind
        children?: Array<BrowserNode> | Observable<Array<BrowserNode>>
    }) {
        super({ ...params, icon: GroupNode.iconsFactory[params.kind] })
        Object.assign(this, params)
        this.groupId = params.id
    }
}

export class DriveNode
    extends BrowserNode
    implements ExplorerBackend.GetDriveResponse
{
    public readonly groupId: string
    public readonly driveId: string
    public readonly metadata: string
    public readonly icon = 'fas fa-hdd'

    constructor(params: {
        groupId: string
        driveId: string
        name: string
        children?: Children
    }) {
        super({ ...params, id: params.driveId })
        Object.assign(this, params)
    }
}

type FolderKind = 'regular' | 'home' | 'download' | 'trash' | 'system'

export class FolderNode<T extends FolderKind>
    extends BrowserNode
    implements ExplorerBackend.GetFolderResponse
{
    static iconsFactory: Record<FolderKind, string> = {
        regular: 'fas fa-folder',
        home: 'fas fa-home',
        download: 'fas fa-shopping-cart',
        trash: 'fas fa-trash',
        system: 'fas fa-cogs',
    }

    public readonly folderId: string
    public readonly groupId: string
    public readonly driveId: string
    public readonly parentFolderId: string
    public readonly metadata: string
    public readonly kind: T

    constructor(
        params: ExplorerBackend.GetFolderResponse & {
            origin?: Origin
            children: Children
        },
    ) {
        super({
            ...params,
            id: params.folderId,
            icon: FolderNode.iconsFactory[params.kind],
            children: getFolderChildren(
                params.groupId,
                params.driveId,
                params.folderId,
            ),
        })
        Object.assign(this, params)
    }
}

export function getFolderChildren(
    groupId: string,
    driveId: string,
    folderId: string,
) {
    return RequestsExecutor.getFolderChildren(groupId, driveId, folderId).pipe(
        map(({ items, folders }) => {
            return [
                ...folders.map((folder) => {
                    return new FolderNode({
                        ...folder,
                        kind: 'regular',
                        children: getFolderChildren(
                            groupId,
                            driveId,
                            folder.folderId,
                        ),
                    })
                }),
                ...items.map((item) => {
                    return new ItemNode(item)
                }),
                ...(driveId == folderId
                    ? [
                          new FolderNode<'trash'>({
                              groupId: groupId,
                              parentFolderId: driveId,
                              driveId: driveId,
                              kind: 'trash',
                              name: 'Trash',
                              folderId: 'trash',
                              metadata: '',
                              children: getDeletedChildren(driveId),
                          }),
                      ]
                    : []),
            ]
        }),
    ) as Observable<Array<BrowserNode>>
}

export function getDeletedChildren(driveId: string) {
    return RequestsExecutor.getDeletedItems(driveId).pipe(
        map(({ items, folders }) => {
            return [
                ...folders.map(
                    (folder) =>
                        new DeletedFolderNode({
                            id: folder.folderId,
                            name: folder.name,
                            driveId,
                        }),
                ),
                ...items.map(
                    (item) =>
                        new DeletedItemNode({
                            id: item.itemId,
                            name: item.name,
                            driveId,
                            kind: item.kind,
                        }),
                ),
            ]
        }),
    ) as Observable<Array<BrowserNode>>
}

export type RegularFolderNode = FolderNode<'regular'>
export type HomeNode = FolderNode<'home'>
export type DownloadNode = FolderNode<'download'>
export type TrashNode = FolderNode<'trash'>
export type SystemNode = FolderNode<'system'>
export type AnyFolderNode = FolderNode<FolderKind>

export function instanceOfTrashFolder(folder: BrowserNode) {
    return (
        ExplorerBackend.isInstanceOfFolderResponse(folder) &&
        folder.kind == 'trash'
    )
}

export function instanceOfStandardFolder(folder: BrowserNode) {
    return (
        ExplorerBackend.isInstanceOfFolderResponse(folder) &&
        (folder.kind == 'regular' ||
            folder.kind == 'home' ||
            folder.kind == 'download')
    )
}

export class ItemNode
    extends BrowserNode
    implements ExplorerBackend.GetItemResponse
{
    static iconsFactory: { [key: string]: string } = {
        data: 'fas fa-database',
        package: 'fas fa-box',
    }
    public readonly id: string
    public readonly name: string
    public readonly groupId: string
    public readonly driveId: string
    public readonly rawId: string
    public readonly assetId: string
    public readonly itemId: string
    public readonly folderId: string
    public readonly borrowed: boolean
    public readonly kind: string
    public readonly icon: string
    public readonly metadata: string

    constructor(params: ExplorerBackend.GetItemResponse & { origin?: Origin }) {
        super({ ...params, children: undefined, id: params.itemId })
        Object.assign(this, params)
        this.icon = ItemNode.iconsFactory[this.kind]
    }
}

export class FutureNode extends BrowserNode {
    public readonly onResponse: (unknown, BrowserNode) => void
    public readonly response$: Observable<unknown>

    constructor(params: {
        icon: string
        name: string
        onResponse: (unknown, BrowserNode) => void
        response$: Observable<unknown>
    }) {
        super({ ...params, id: uuidv4() })
        Object.assign(this, params)
    }
}

export class FutureItemNode extends FutureNode {}
export class FutureFolderNode extends FutureNode {}

export class DeletedNode extends BrowserNode {
    public readonly name: string
    public readonly driveId: string

    constructor({ id, name, driveId }) {
        super({ id, name, children: undefined })
        this.name = name
        this.driveId = driveId
    }
}

export class DeletedFolderNode extends DeletedNode {
    public readonly name: string
    public readonly driveId: string

    constructor({
        id,
        driveId,
        name,
    }: {
        id: string
        driveId: string
        name: string
    }) {
        super({ id, name, driveId })
    }
}
export class DeletedItemNode extends DeletedNode {
    public readonly name: string
    public readonly driveId: string
    public readonly kind: string

    constructor({
        id,
        driveId,
        name,
        kind,
    }: {
        id: string
        driveId: string
        name: string
        kind: string
    }) {
        super({ id, name, driveId })
        this.kind = kind
    }
}

export class ProgressNode extends BrowserNode {
    public readonly progress$: Observable<RequestEvent>
    public readonly response$: Observable<unknown>
    public readonly onResponse: (unknown, BrowserNode) => void
    public readonly direction: 'upload' | 'download'
    constructor(params: {
        id: string
        name: string
        progress$: Observable<RequestEvent>
        response$: Observable<unknown>
        onResponse: (unknown, BrowserNode) => void
        direction: 'upload' | 'download'
    }) {
        super({ id: params.id, name: params.name })
        Object.assign(this, params)
        this.response$.subscribe((response) => this.onResponse(response, this))
    }
}

export type AnyItemNode =
    | ItemNode
    | FutureItemNode
    | DeletedItemNode
    | ProgressNode
