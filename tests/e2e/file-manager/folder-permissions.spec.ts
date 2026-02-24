import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  ALL_USER_FOLDER_PERMISSIONS,
  createUserWithPermissions,
  getAdminToken,
  STORAGE_PERMISSIONS,
} from '../helpers/permissions.helper';
import {
  apiRequest,
  createTestFolder,
  getContextMenuItems,
  initializeSystemFolders,
  navigateToFileManager,
  rightClickItem,
} from '../helpers/storage.helper';

// System folder name (auto-created by initialize)
const SYSTEM_FOLDER = 'Estoque';
// Filter folder name
const FILTER_FOLDER = 'Boletos (Todos)';

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);
});

test.describe('File Manager - Permissões de Pastas do Usuário', () => {
  // ─── 4.1 Menu de pasta do usuário com permissões completas ─────────

  test('4.1 - Menu de pasta do usuário com permissões completas', async ({
    page,
  }) => {
    const folderName = `e2e-uf-${Date.now()}`;
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      ...ALL_USER_FOLDER_PERMISSIONS,
    ]);

    // Create the folder with the user's own token so they can see it
    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await rightClickItem(page, folderName);
    const items = await getContextMenuItems(page);

    expect(items).toContain('Abrir');
    expect(items).toContain('Renomear');
    expect(items).toContain('Alterar cor');
    expect(items).toContain('Mover');
    expect(items).toContain('Gerenciar acesso');
    expect(items).toContain('Excluir');
  });

  // ─── 4.2 Ocultar edição sem storage.user-folders.update ────────────

  test('4.2 - Menu de pasta do usuário sem storage.user-folders.update', async ({
    page,
  }) => {
    const folderName = `e2e-uf-${Date.now()}`;
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
      STORAGE_PERMISSIONS.USER_FOLDERS_DELETE,
      STORAGE_PERMISSIONS.USER_FOLDERS_DOWNLOAD,
      STORAGE_PERMISSIONS.USER_FOLDERS_SHARE_USER,
      // NO storage.user-folders.update
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await rightClickItem(page, folderName);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Renomear');
    expect(items).not.toContain('Alterar cor');
    expect(items).not.toContain('Mover');
    expect(items).toContain('Abrir');
  });

  // ─── 4.3 Ocultar "Excluir" sem storage.user-folders.delete ────────

  test('4.3 - Menu de pasta do usuário sem storage.user-folders.delete', async ({
    page,
  }) => {
    const folderName = `e2e-uf-${Date.now()}`;
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
      STORAGE_PERMISSIONS.USER_FOLDERS_UPDATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_DOWNLOAD,
      // NO storage.user-folders.delete
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await rightClickItem(page, folderName);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Excluir');
    expect(items).toContain('Renomear');
  });
});

test.describe('File Manager - Permissões de Pastas do Sistema', () => {
  // ─── 4.4 Pasta do sistema nunca exibe editar/excluir ───────────────

  test('4.4 - Menu de pasta do sistema nunca exibe editar/excluir', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([...ALL_STORAGE_PERMISSIONS]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await rightClickItem(page, SYSTEM_FOLDER);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Renomear');
    expect(items).not.toContain('Alterar cor');
    expect(items).not.toContain('Mover');
    expect(items).not.toContain('Excluir');
    expect(items).toContain('Abrir');
  });

  // ─── 4.5 Pasta de filtragem nunca exibe editar/excluir ─────────────

  test('4.5 - Menu de pasta de filtragem nunca exibe editar/excluir', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([...ALL_STORAGE_PERMISSIONS]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await rightClickItem(page, FILTER_FOLDER);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Renomear');
    expect(items).not.toContain('Alterar cor');
    expect(items).not.toContain('Mover');
    expect(items).not.toContain('Excluir');
  });

  // ─── 4.6 Ocultar "Baixar" em pasta de sistema sem permissão ───────

  test('4.6 - Menu de pasta do sistema sem storage.system-folders.download', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_LIST,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_READ,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_SHARE_USER,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_SHARE_GROUP,
      // NO storage.system-folders.download
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await rightClickItem(page, SYSTEM_FOLDER);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Baixar');
  });

  // ─── 4.7 Ocultar "Gerenciar acesso" sem share permissions ─────────

  test('4.7 - Menu de pasta do sistema sem permissões de compartilhamento', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_LIST,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_READ,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_DOWNLOAD,
      // NO share-user / share-group
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await rightClickItem(page, SYSTEM_FOLDER);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Gerenciar acesso');
  });

  // ─── 4.8 Ocultar "Baixar" em pasta de filtragem sem permissão ─────

  test('4.8 - Menu de pasta de filtragem sem storage.filter-folders.download', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.FILTER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.FILTER_FOLDERS_READ,
      STORAGE_PERMISSIONS.FILTER_FOLDERS_SHARE_USER,
      // NO storage.filter-folders.download
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await rightClickItem(page, FILTER_FOLDER);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Baixar');
  });
});

test.describe('File Manager - Enforcement Backend (Pastas)', () => {
  // ─── 4.9 Backend rejeita exclusão sem permissão ─────────────────────

  test('4.9 - Backend deve rejeitar exclusão de pasta sem storage.user-folders.delete', async () => {
    // Create a folder as admin to have a target
    const admin = await getAdminToken();
    const folderId = await createTestFolder(
      admin.token,
      `e2e-del-test-${Date.now()}`
    );

    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'DELETE',
      `/v1/storage/folders/${folderId}`
    );

    expect(status).toBe(403);
  });

  // ─── 4.10 Backend rejeita criação sem permissão ────────────────────

  test('4.10 - Backend deve rejeitar criação de pasta sem storage.user-folders.create', async () => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'POST',
      '/v1/storage/folders',
      { name: 'unauthorized-folder' }
    );

    expect(status).toBe(403);
  });
});
