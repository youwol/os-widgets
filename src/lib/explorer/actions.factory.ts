import { forkJoin, Observable, of } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { ExplorerState } from './explorer.state'
import {
    AssetsGateway,
    AssetsBackend,
    AssetsGateway as Gtw,
} from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import * as webpmClient from '@youwol/webpm-client'
import * as rxVdom from '@youwol/rx-vdom'
import {
    AnyFolderNode,
    BrowserNode,
    DeletedNode,
    DriveNode,
    instanceOfStandardFolder,
    FolderNode,
    FutureNode,
    ItemNode,
    ProgressNode,
    RegularFolderNode,
    TrashNode,
} from './nodes'

import {
    isLocalYouwol,
    Installer,
    evaluateMatch,
    evaluateParameters,
    openingApps$,
    FavoritesFacade,
} from '@youwol/os-core'
import { AnyVirtualDOM } from '@youwol/rx-vdom'

export type Section =
    | 'Modify'
    | 'Move'
    | 'New'
    | 'IO'
    | 'Disposition'
    | 'Info'
    | 'CustomActions'
    | 'Open'

export interface Action {
    sourceEventNode: BrowserNode
    icon: AnyVirtualDOM
    name: string
    enabled: () => boolean | Promise<boolean>
    exe: () => void | Promise<void>
    applicable: () => boolean | Promise<boolean>
    section: Section
}

export interface GroupPermissions {
    write: boolean
}

export interface OverallPermissions {
    group: GroupPermissions
    item?: AssetsBackend.PermissionsResp
}

export type ActionConstructor = (
    state: ExplorerState,
    node: BrowserNode,
    permissions: OverallPermissions,
) => Action

/**
 * fetch the permissions of the current user regarding a group management
 */
function fetchGroupPermissions$(_groupId: string) {
    return of({
        write: true,
    })
}

/**
 * fetch the permissions of the current user regarding an asset
 */
function fetchItemPermissions$(node: ItemNode) {
    if (node.origin && !node.origin.local) {
        return of({
            write: false,
            read: true,
            share: false,
        })
    }
    return new Gtw.Client().assets
        .getPermissions$({
            assetId: node.assetId,
        })
        .pipe(raiseHTTPErrors())
}

function hasItemModifyPermission(
    node: BrowserNode,
    permissions: OverallPermissions,
) {
    if (!permissions.item) {
        return false
    }

    if (!permissions.item.write || !permissions.group.write) {
        return false
    }
    return !(node.origin && !node.origin.local)
}

function hasItemSharePermission(
    node: BrowserNode,
    permissions: OverallPermissions,
) {
    return permissions.item && permissions.item.share
}

function hasGroupModifyPermissions(permissions: OverallPermissions) {
    return permissions.group.write
}

export const GENERIC_ACTIONS: { [k: string]: ActionConstructor } = {
    renameItem: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-pen' },
        name: 'rename',
        section: 'Modify',
        enabled: () => hasItemModifyPermission(node, permissions),
        applicable: () => {
            return node instanceof ItemNode
        },
        exe: () => {
            node.addStatus({ type: 'renaming' })
        },
    }),
    renameFolder: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-pen' },
        name: 'rename',
        section: 'Modify',
        enabled: () => hasGroupModifyPermissions(permissions),
        applicable: () => {
            return node instanceof FolderNode && node.kind == 'regular'
        },
        exe: () => {
            node.addStatus({ type: 'renaming' })
        },
    }),
    newFolder: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-folder' },
        name: 'new folder',
        section: 'New',
        enabled: () => hasGroupModifyPermissions(permissions),
        applicable: () => {
            return instanceOfStandardFolder(node) || node instanceof DriveNode
        },
        exe: () => {
            state.newFolder(node as AnyFolderNode | DriveNode)
        },
    }),
    download: (state: ExplorerState, node: BrowserNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-download' },
        name: 'download file',
        section: 'IO',
        enabled: () => true,
        applicable: () => node instanceof ItemNode && node.kind == 'data',
        exe: () => {
            const nodeData = node as ItemNode
            const anchor = document.createElement('a')
            anchor.setAttribute(
                'href',
                `/api/assets-gateway/raw/data/${nodeData.rawId}`,
            )
            anchor.setAttribute('download', nodeData.name)
            anchor.dispatchEvent(new MouseEvent('click'))
            anchor.remove()
        },
    }),
    upload: (state: ExplorerState, node: BrowserNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-upload' },
        name: 'upload asset',
        section: 'IO',
        enabled: () => true,
        applicable: () => {
            return (
                isLocalYouwol() &&
                node instanceof ItemNode &&
                node.origin &&
                node.origin.local
            )
        },
        exe: () => {
            state.uploadAsset(node as ItemNode)
        },
    }),
    deleteFolder: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-trash' },
        name: 'delete',
        section: 'Modify',
        enabled: () => hasGroupModifyPermissions(permissions),
        applicable: () => {
            return node instanceof FolderNode && node.kind == 'regular'
        },
        exe: () => {
            state.deleteItemOrFolder(node as RegularFolderNode)
        },
    }),
    deleteDrive: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-trash' },
        name: 'delete drive',
        section: 'Modify',
        enabled: () => hasGroupModifyPermissions(permissions),
        applicable: () => {
            return node instanceof DriveNode
        },
        exe: () => {
            state.deleteDrive(node as DriveNode)
        },
    }),
    clearTrash: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-times' },
        name: 'clear trash',
        section: 'Modify',
        enabled: () => hasGroupModifyPermissions(permissions),
        applicable: () => node instanceof FolderNode && node.kind == 'trash',
        exe: () => {
            state.purgeDrive(node as TrashNode)
        },
    }),
    paste: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-paste' },
        name: 'paste',
        section: 'Move',
        enabled: () => hasGroupModifyPermissions(permissions),
        applicable: () => {
            return instanceOfStandardFolder(node) && state.itemCut != undefined
        },
        exe: () => {
            state.pasteItem(node as AnyFolderNode)
        },
    }),
    cut: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-cut' },
        name: 'cut',
        section: 'Move',
        enabled: () => hasItemModifyPermission(node, permissions),
        applicable: () => {
            if (node instanceof ItemNode) {
                return !node.borrowed
            }
            return instanceOfStandardFolder(node)
        },
        exe: () => {
            state.cutItem(node as ItemNode | RegularFolderNode)
        },
    }),
    borrowItem: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-link' },
        name: 'borrow item',
        section: 'Move',
        enabled: () => hasItemSharePermission(node, permissions),
        applicable: () => node instanceof ItemNode,
        exe: () => {
            state.borrowItem(node as ItemNode)
        },
    }),
    deleteItem: (
        state: ExplorerState,
        node: BrowserNode,
        permissions: OverallPermissions,
    ) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-trash' },
        name: 'delete',
        section: 'Modify',
        enabled: () => hasItemModifyPermission(node, permissions),
        applicable: () => {
            return node instanceof ItemNode
        },
        exe: () => {
            state.deleteItemOrFolder(node as ItemNode)
        },
    }),
    refresh: (state: ExplorerState, node: BrowserNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-sync-alt' },
        name: 'refresh',
        section: 'Disposition',
        enabled: () => true,
        applicable: () => node instanceof FolderNode,
        exe: () => {
            state.refresh(node as AnyFolderNode)
        },
    }),
    copyFileId: (state: ExplorerState, node: ItemNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-clipboard' },
        name: "copy file's id",
        section: 'Info',
        enabled: () => true,
        applicable: () => node instanceof ItemNode && node.kind == 'data',
        exe: () => {
            navigator.clipboard.writeText(node.rawId).then()
        },
    }),
    copyExplorerId: (state: ExplorerState, node: ItemNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-clipboard' },
        name: "copy explorer's id",
        section: 'Info',
        enabled: () => true,
        applicable: () => node instanceof ItemNode && node.kind == 'data',
        exe: () => {
            navigator.clipboard.writeText(node.itemId).then()
        },
    }),
    copyAssetId: (state: ExplorerState, node: ItemNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-clipboard' },
        name: "copy asset's id",
        section: 'Info',
        enabled: () => true,
        applicable: () => node instanceof ItemNode,
        exe: () => {
            navigator.clipboard.writeText(node.assetId).then()
        },
    }),
    copyFileUrl: (state: ExplorerState, node: ItemNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-clipboard' },
        name: "copy file's url",
        section: 'Info',
        enabled: () => true,
        applicable: () => node instanceof ItemNode && node.kind == 'data',
        exe: () => {
            navigator.clipboard
                .writeText(
                    `${window.location.host}/api/assets-gateway/files-backend/files/${node.rawId}`,
                )
                .then()
        },
    }),
    favoriteFolder: (state: ExplorerState, node: BrowserNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-map-pin' },
        name: 'add to favorites',
        section: 'Disposition',
        enabled: () => true,
        applicable: () => {
            const favorites = FavoritesFacade.getFolders$().getValue()
            return (
                node instanceof FolderNode &&
                favorites.find((f) => f.folderId == node.id) == undefined
            )
        },
        exe: () => {
            FavoritesFacade.toggleFavoriteFolder(node.id)
        },
    }),
    unFavoriteFolder: (state: ExplorerState, node: BrowserNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-unlink' },
        name: 'un-favorite',
        section: 'Disposition',
        enabled: () => true,
        applicable: () => {
            const favorites = FavoritesFacade.getFolders$().getValue()
            return (
                node instanceof FolderNode &&
                favorites.find((f) => f.folderId == node.id) != undefined
            )
        },
        exe: () => {
            FavoritesFacade.toggleFavoriteFolder(node.id)
        },
    }),
    favoriteDesktopItem: (state: ExplorerState, node: BrowserNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-map-pin' },
        name: 'add to desktop',
        section: 'Disposition',
        enabled: () => true,
        applicable: () => {
            const favorites = FavoritesFacade.getItems$().getValue()
            return (
                node instanceof ItemNode &&
                favorites.find((i) => i.itemId == node.id) == undefined
            )
        },
        exe: () => {
            FavoritesFacade.toggleFavoriteItem(node.id)
        },
    }),
    unFavoriteDesktopItem: (state: ExplorerState, node: BrowserNode) => ({
        sourceEventNode: node,
        icon: { tag: 'div', class: 'fas fa-unlink' },
        name: 'remove from desktop',
        section: 'Disposition',
        enabled: () => true,
        applicable: () => {
            const favorites = FavoritesFacade.getItems$().getValue()
            return (
                node instanceof ItemNode &&
                favorites.find((i) => i.itemId == node.id) != undefined
            )
        },
        exe: () => {
            FavoritesFacade.toggleFavoriteItem(node.id)
        },
    }),
}

export function getActions$(
    state: ExplorerState,
    node: BrowserNode,
): Observable<Array<Action>> {
    if (node instanceof FutureNode || node instanceof ProgressNode) {
        return of([])
    }
    if (node instanceof DeletedNode) {
        return of([])
    } // restore at some point

    if (!(node instanceof ItemNode) && !(node instanceof FolderNode)) {
        return of([])
    }

    const permissions$ =
        node instanceof ItemNode
            ? forkJoin([
                  fetchItemPermissions$(node),
                  fetchGroupPermissions$(node.groupId),
              ]).pipe(
                  map(([item, group]) => {
                      return { group, item }
                  }),
              )
            : fetchGroupPermissions$(node.groupId).pipe(
                  raiseHTTPErrors(),
                  map((group) => {
                      return { group }
                  }),
              )

    return forkJoin([
        permissions$,
        Installer.getInstallManifest$().pipe(take(1)),
        node instanceof ItemNode ? openingApps$(node).pipe(take(1)) : of([]),
    ]).pipe(
        map(([permissions, installManifest, openingApps]) => {
            const customActions: Action[] = installManifest
                .contextMenuActions({
                    node,
                    explorer: state,
                    cdnClient: webpmClient,
                    assetsGtwClient: new AssetsGateway.Client(),
                    fluxView: rxVdom,
                })
                .map((action) => {
                    return {
                        ...action,
                        enabled: () => true,
                        sourceEventNode: node,
                        section: 'CustomActions',
                    }
                })
            const openWithActions: Action[] = openingApps.map(
                ({ appInfo, parametrization }) => ({
                    sourceEventNode: node,
                    icon: { tag: 'div', class: 'fas fa-folder-open' },
                    name: `${appInfo.displayName} ${
                        parametrization.name || ''
                    }`,
                    section: 'Open',
                    enabled: () => true,
                    applicable: () => {
                        return evaluateMatch(node as ItemNode, parametrization)
                    },
                    exe: () => {
                        state.launchApplication({
                            cdnPackage: appInfo.cdnPackage,
                            parameters: evaluateParameters(
                                node as ItemNode,
                                parametrization,
                            ),
                        })
                    },
                }),
            )

            const nativeActions = Object.values(GENERIC_ACTIONS).map((action) =>
                action(state, node, permissions),
            )
            return [
                ...nativeActions,
                ...customActions,
                ...openWithActions,
            ].filter((a) => a.applicable())
        }),
    )
}
