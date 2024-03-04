import { ImmutableTree } from '@youwol/rx-tree-views'
import { delay } from 'rxjs/operators'

import {
    AnyFolderNode,
    AnyItemNode,
    BrowserNode,
    DriveNode,
    FolderNode,
    FutureNode,
    ItemNode,
    RegularFolderNode,
} from './nodes'

import { debugDelay, RequestsExecutor, FavoritesFacade } from '@youwol/os-core'
import { v4 as uuidv4 } from 'uuid'

function isToProcess({ update, targetCmd }) {
    if (!(update.command instanceof targetCmd)) {
        return false
    }
    return !(update.command.metadata && !update.command.metadata.toBeSaved)
}

function onAchieved(update: ImmutableTree.Updates<BrowserNode>) {
    const metadata = update.command.metadata as { onAchieved: () => void }
    metadata && metadata.onAchieved && metadata.onAchieved()
}

function onRenamed(
    node: BrowserNode,
    update: ImmutableTree.Updates<BrowserNode>,
    uid: string,
) {
    node.removeStatus({ type: 'request-pending', id: uid })
    FavoritesFacade.refresh(node.id)
    onAchieved(update)
}

function onDeleted(
    parent: BrowserNode,
    node: BrowserNode,
    update: ImmutableTree.Updates<BrowserNode>,
    uid: string,
) {
    parent.removeStatus({ type: 'request-pending', id: uid })
    FavoritesFacade.remove(node.id)
    onAchieved(update)
}

export const databaseActionsFactory = {
    renameFolder: (update: ImmutableTree.Updates<BrowserNode>) => ({
        when: () => {
            if (
                !isToProcess({
                    update,
                    targetCmd: ImmutableTree.ReplaceAttributesCommand,
                })
            ) {
                return false
            }

            if (
                update.addedNodes.length != 1 ||
                !(update.addedNodes[0] instanceof FolderNode)
            ) {
                return false
            }

            const node = update.addedNodes[0] as AnyFolderNode
            return node.kind == 'regular'
        },
        then: () => {
            const node = update.addedNodes[0] as RegularFolderNode
            const uid = uuidv4()
            node.addStatus({ type: 'request-pending', id: uid })
            RequestsExecutor.renameFolder(node.id, node.name)
                .pipe(delay(debugDelay))
                .subscribe(() => {
                    onRenamed(node, update, uid)
                })
        },
    }),
    renameItem: (update: ImmutableTree.Updates<BrowserNode>) => ({
        when: () => {
            if (
                !isToProcess({
                    update,
                    targetCmd: ImmutableTree.ReplaceAttributesCommand,
                })
            ) {
                return false
            }

            return (
                update.addedNodes.length == 1 &&
                update.addedNodes[0] instanceof ItemNode
            )
        },
        then: () => {
            const node = update.addedNodes[0] as AnyItemNode
            const uid = uuidv4()
            node.addStatus({ type: 'request-pending', id: uid })
            RequestsExecutor.renameItem(node.id, node.name)
                .pipe(delay(debugDelay))
                .subscribe(() => {
                    onRenamed(node, update, uid)
                })
        },
    }),
    deleteFolder: (update: ImmutableTree.Updates<BrowserNode>) => ({
        when: () => {
            if (
                !isToProcess({
                    update,
                    targetCmd: ImmutableTree.RemoveNodeCommand,
                })
            ) {
                return false
            }

            if (update.removedNodes.length !== 1) {
                return false
            }

            const node = update.removedNodes[0]
            return node instanceof FolderNode
        },
        then: () => {
            const node = update.removedNodes[0] as FolderNode<'regular'>
            const cmd = update.command as ImmutableTree.RemoveNodeCommand<
                FolderNode<'regular'>
            >
            const parent = cmd.parentNode
            const uid = uuidv4()
            parent.addStatus({ type: 'request-pending', id: uid })
            RequestsExecutor.trashFolder(node.folderId)
                .pipe(delay(debugDelay))
                .subscribe(() => {
                    onDeleted(parent, node, update, uid)
                })
        },
    }),
    deleteDrive: (update: ImmutableTree.Updates<BrowserNode>) => ({
        when: () => {
            if (
                !isToProcess({
                    update,
                    targetCmd: ImmutableTree.RemoveNodeCommand,
                })
            ) {
                return false
            }

            if (update.removedNodes.length !== 1) {
                return false
            }

            const node = update.removedNodes[0]

            return node instanceof DriveNode
        },
        then: () => {
            const node = update.removedNodes[0] as DriveNode
            const cmd =
                update.command as ImmutableTree.RemoveNodeCommand<DriveNode>
            const parent = cmd.parentNode
            const uid = uuidv4()
            parent.addStatus({ type: 'request-pending', id: uid })
            RequestsExecutor.deleteDrive(node.driveId)
                .pipe(delay(debugDelay))
                .subscribe(() => {
                    parent.removeStatus({ type: 'request-pending', id: uid })
                    onAchieved(update)
                })
        },
    }),
    deleteItem: (update: ImmutableTree.Updates<BrowserNode>) => ({
        when: () => {
            if (
                !isToProcess({
                    update,
                    targetCmd: ImmutableTree.RemoveNodeCommand,
                })
            ) {
                return false
            }

            return (
                update.removedNodes.length == 1 &&
                update.removedNodes[0] instanceof ItemNode
            )
        },
        then: () => {
            const node = update.removedNodes[0] as ItemNode
            const cmd =
                update.command as ImmutableTree.RemoveNodeCommand<ItemNode>
            const parent = cmd.parentNode
            const uid = uuidv4()
            parent.addStatus({ type: 'request-pending', id: uid })
            RequestsExecutor.trashItem(node.itemId)
                .pipe(delay(debugDelay))
                .subscribe(() => {
                    onDeleted(parent, node, update, uid)
                })
        },
    }),
    newAsset: (update: ImmutableTree.Updates<BrowserNode>) => ({
        when: () => {
            if (
                !isToProcess({
                    update,
                    targetCmd: ImmutableTree.AddChildCommand,
                })
            ) {
                return false
            }

            return (
                update.addedNodes.length == 1 &&
                update.addedNodes[0] instanceof FutureNode
            )
        },
        then: () => {
            const node = update.addedNodes[0] as FutureNode
            const cmd =
                update.command as ImmutableTree.AddChildCommand<BrowserNode>
            const parentNode = cmd.parentNode as AnyFolderNode
            const uid = uuidv4()
            node.addStatus({ type: 'request-pending', id: uid })
            parentNode.addStatus({ type: 'request-pending', id: uid })
            node.response$.pipe(delay(debugDelay)).subscribe((resp) => {
                parentNode.removeStatus({ type: 'request-pending', id: uid })
                node.removeStatus({ type: 'request-pending', id: uid })
                node.onResponse(resp, node)
                onAchieved(update)
            })
        },
    }),
}

export function applyUpdate(update: ImmutableTree.Updates<BrowserNode>) {
    const command = Object.values(databaseActionsFactory)
        .map((actionFactory) => actionFactory(update))
        .find((action) => action.when())
    command && command.then()
}
