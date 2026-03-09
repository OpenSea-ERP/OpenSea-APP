import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  createUserWithPermissions,
  getAdminToken,
} from '../helpers/permissions.helper';
import {
  createTestFolder,
  doubleClickItem,
  getBreadcrumbTexts,
  getFolderContentsViaApi,
  initializeSystemFolders,
  navigateToFileManager,
  uploadTestFile,
  waitForToast,
} from '../helpers/storage.helper';

const DRAG_MIME = 'application/x-storage-item';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-dnd-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

// =============================================================================
// HTML5 Drag-and-Drop Simulation Helper
// =============================================================================

/**
 * Simulate a full HTML5 drag-and-drop sequence between two elements.
 * Playwright's built-in dragTo() uses mouse events, but our file manager
 * uses native HTML5 DnD (dragstart/dragover/drop with DataTransfer).
 *
 * NOTE: In the grid view, `[data-item-id]` is a wrapper div. The actual
 * drag/drop handlers live on the inner card div (which has `draggable`).
 * We find the innermost draggable or the first child div for dispatch.
 */
async function simulateDragAndDrop(
  page: Page,
  sourceSelector: string,
  targetSelector: string,
  dragData: { id: string; type: 'folder' | 'file' }[]
) {
  await page.evaluate(
    ({ sourceSelector, targetSelector, dragData, mime }) => {
      /**
       * Given a wrapper selector, find the actual element that has drag handlers.
       * Priority: [draggable="true"] descendant > first child div > the element itself.
       */
      function findDragTarget(selector: string): Element {
        const wrapper = document.querySelector(selector);
        if (!wrapper) throw new Error(`Element not found: ${selector}`);
        // In grid view: wrapper is [data-item-id], handlers are on inner div.
        // Check for draggable attribute (React renders as "true" or "")
        const draggable = wrapper.querySelector('[draggable]');
        if (draggable) return draggable;
        // Fallback: first child div
        const firstDiv = wrapper.querySelector('div');
        return firstDiv ?? wrapper;
      }

      const source = findDragTarget(sourceSelector);
      const target = findDragTarget(targetSelector);

      // Create a DataTransfer stub since Chromium test environments
      // don't always populate custom MIME types correctly via constructor
      const dataStore: Record<string, string> = {};
      const dt = new DataTransfer();

      const origSetData = dt.setData.bind(dt);
      const origGetData = dt.getData.bind(dt);
      dt.setData = (format: string, data: string) => {
        dataStore[format] = data;
        try {
          origSetData(format, data);
        } catch {
          // Some browsers don't support custom MIME in constructor
        }
      };
      dt.getData = (format: string) => {
        return dataStore[format] ?? origGetData(format);
      };
      Object.defineProperty(dt, 'types', {
        get: () => Object.keys(dataStore),
      });

      // 1. dragstart on source
      dt.setData(mime, JSON.stringify(dragData));
      dt.effectAllowed = 'move';
      source.dispatchEvent(
        new DragEvent('dragstart', { dataTransfer: dt, bubbles: true })
      );

      // 2. dragenter on target
      target.dispatchEvent(
        new DragEvent('dragenter', { dataTransfer: dt, bubbles: true })
      );

      // 3. dragover on target (must be called to allow drop)
      target.dispatchEvent(
        new DragEvent('dragover', { dataTransfer: dt, bubbles: true })
      );

      // 4. drop on target
      target.dispatchEvent(
        new DragEvent('drop', { dataTransfer: dt, bubbles: true })
      );

      // 5. dragend on source
      source.dispatchEvent(
        new DragEvent('dragend', { dataTransfer: dt, bubbles: true })
      );
    },
    { sourceSelector, targetSelector, dragData, mime: DRAG_MIME }
  );
}

// =============================================================================
// Tests
// =============================================================================

test.describe('File Manager - Drag and Drop', () => {
  // ─── Drag file into folder (grid view) ─────────────────────────────
  test('DnD-1 - Arrastar arquivo para dentro de pasta (grid)', async ({
    page,
  }) => {
    const ts = Date.now();
    const parentName = `e2e-dnd-parent-${ts}`;
    const targetName = `e2e-dnd-target-${ts}`;
    const fileName = `dnd-file-${ts}.txt`;

    // Setup: parent folder with a child folder and a file
    const parentId = await createTestFolder(userToken, parentName);
    const targetId = await createTestFolder(userToken, targetName, parentId);
    const fileId = await uploadTestFile(userToken, parentId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into parent folder
    await doubleClickItem(page, parentName);
    await expect(page.locator(`[title="${targetName}"]`)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(`[title="${fileName}"]`)).toBeVisible({
      timeout: 10_000,
    });

    // Drag the file into the target folder
    const sourceSelector = `[data-item-id="${fileId}"]`;
    // Target: the div inside the folder card wrapper
    const targetSelector = `[data-item-id="${targetId}"]`;

    await simulateDragAndDrop(page, sourceSelector, targetSelector, [
      { id: fileId, type: 'file' },
    ]);

    // Verify toast
    await waitForToast(page, 'Item movido com sucesso');

    // Verify file is no longer in the current folder
    await expect(page.locator(`[title="${fileName}"]`)).not.toBeVisible({
      timeout: 10_000,
    });

    // Verify via API that file is now inside target folder
    const contents = await getFolderContentsViaApi(userToken, targetId);
    const movedFile = contents.files.find(f => f.name === fileName);
    expect(movedFile).toBeTruthy();
  });

  // ─── Drag folder into folder (grid view) ───────────────────────────
  test('DnD-2 - Arrastar pasta para dentro de outra pasta (grid)', async ({
    page,
  }) => {
    const ts = Date.now();
    const parentName = `e2e-dnd2-parent-${ts}`;
    const folderA = `e2e-dnd2-A-${ts}`;
    const folderB = `e2e-dnd2-B-${ts}`;

    // Setup: parent with two child folders
    const parentId = await createTestFolder(userToken, parentName);
    const folderAId = await createTestFolder(userToken, folderA, parentId);
    const folderBId = await createTestFolder(userToken, folderB, parentId);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into parent
    await doubleClickItem(page, parentName);
    await expect(page.locator(`[title="${folderA}"]`)).toBeVisible({
      timeout: 10_000,
    });

    // Drag folder A into folder B
    await simulateDragAndDrop(
      page,
      `[data-item-id="${folderAId}"]`,
      `[data-item-id="${folderBId}"]`,
      [{ id: folderAId, type: 'folder' }]
    );

    await waitForToast(page, 'Item movido com sucesso');

    // Folder A should disappear from current view
    await expect(page.locator(`[title="${folderA}"]`)).not.toBeVisible({
      timeout: 10_000,
    });

    // Verify via API
    const contents = await getFolderContentsViaApi(userToken, folderBId);
    const movedFolder = contents.folders.find(f => f.name === folderA);
    expect(movedFolder).toBeTruthy();
  });

  // ─── Drag file to breadcrumb (parent folder) ───────────────────────
  test('DnD-3 - Arrastar arquivo para breadcrumb (pasta pai)', async ({
    page,
  }) => {
    const ts = Date.now();
    const parentName = `e2e-dnd3-parent-${ts}`;
    const childName = `e2e-dnd3-child-${ts}`;
    const fileName = `dnd3-file-${ts}.txt`;

    // Setup: parent > child, file inside child
    const parentId = await createTestFolder(userToken, parentName);
    const childId = await createTestFolder(userToken, childName, parentId);
    const fileId = await uploadTestFile(userToken, childId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into parent → child
    await doubleClickItem(page, parentName);
    await expect(page.locator(`[title="${childName}"]`)).toBeVisible({
      timeout: 10_000,
    });
    await doubleClickItem(page, childName);
    await expect(page.locator(`[title="${fileName}"]`)).toBeVisible({
      timeout: 10_000,
    });

    // Verify breadcrumb shows parent
    const breadcrumb = await getBreadcrumbTexts(page);
    expect(breadcrumb.join(' ')).toContain(parentName);

    // Drag file to the parent breadcrumb item
    // The FM breadcrumb is the 2nd nav on the page; target the div wrapper around the parent link
    const fmBreadcrumb = page.locator('nav[aria-label="breadcrumb"]').nth(1);
    const parentBreadcrumbLink = fmBreadcrumb.locator(
      `a:has-text("${parentName}")`
    );
    await expect(parentBreadcrumbLink).toBeVisible({ timeout: 5_000 });

    // Use evaluate to get the parent div wrapper (the drop target)
    const parentBreadcrumbDiv = parentBreadcrumbLink.locator('..');

    // We need to simulate DnD targeting the wrapper div of the breadcrumb link
    await page.evaluate(
      ({ fileId, parentId, mime, parentName }) => {
        // Find the FM breadcrumb (2nd breadcrumb nav on page)
        const breadcrumbs = document.querySelectorAll(
          'nav[aria-label="breadcrumb"]'
        );
        const fmBreadcrumb = breadcrumbs[1];
        if (!fmBreadcrumb) throw new Error('FM breadcrumb not found');

        // Find the breadcrumb link for parentName, then its wrapper div
        const links = fmBreadcrumb.querySelectorAll('a');
        let targetDiv: Element | null = null;
        for (const link of links) {
          if (link.textContent?.includes(parentName)) {
            targetDiv = link.parentElement;
            break;
          }
        }
        if (!targetDiv)
          throw new Error(`Breadcrumb link for "${parentName}" not found`);

        // Find the source element
        const source = document.querySelector(`[data-item-id="${fileId}"]`);
        if (!source) throw new Error('Source element not found');

        // Create DataTransfer stub
        const dataStore: Record<string, string> = {};
        const dt = new DataTransfer();
        const origSetData = dt.setData.bind(dt);
        const origGetData = dt.getData.bind(dt);
        dt.setData = (format: string, data: string) => {
          dataStore[format] = data;
          try {
            origSetData(format, data);
          } catch {
            /* noop */
          }
        };
        dt.getData = (format: string) =>
          dataStore[format] ?? origGetData(format);
        Object.defineProperty(dt, 'types', {
          get: () => Object.keys(dataStore),
        });

        // Dispatch events
        const items = JSON.stringify([{ id: fileId, type: 'file' }]);
        dt.setData(mime, items);
        dt.effectAllowed = 'move';

        source.dispatchEvent(
          new DragEvent('dragstart', { dataTransfer: dt, bubbles: true })
        );
        targetDiv.dispatchEvent(
          new DragEvent('dragenter', { dataTransfer: dt, bubbles: true })
        );
        targetDiv.dispatchEvent(
          new DragEvent('dragover', { dataTransfer: dt, bubbles: true })
        );
        targetDiv.dispatchEvent(
          new DragEvent('drop', { dataTransfer: dt, bubbles: true })
        );
        source.dispatchEvent(
          new DragEvent('dragend', { dataTransfer: dt, bubbles: true })
        );
      },
      { fileId, parentId, mime: DRAG_MIME, parentName }
    );

    // Verify toast
    await waitForToast(page, 'Item movido com sucesso');

    // Verify via API that file is now in parent folder
    const parentContents = await getFolderContentsViaApi(userToken, parentId);
    const movedFile = parentContents.files.find(f => f.name === fileName);
    expect(movedFile).toBeTruthy();
  });

  // ─── Drag multi-select into folder ─────────────────────────────────
  test('DnD-4 - Arrastar múltiplos itens selecionados para pasta', async ({
    page,
  }) => {
    const ts = Date.now();
    const parentName = `e2e-dnd4-parent-${ts}`;
    const targetName = `e2e-dnd4-target-${ts}`;
    const file1Name = `dnd4-f1-${ts}.txt`;
    const file2Name = `dnd4-f2-${ts}.txt`;

    // Setup: parent with target folder + 2 files
    const parentId = await createTestFolder(userToken, parentName);
    const targetId = await createTestFolder(userToken, targetName, parentId);
    const file1Id = await uploadTestFile(userToken, parentId, file1Name);
    const file2Id = await uploadTestFile(userToken, parentId, file2Name);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into parent
    await doubleClickItem(page, parentName);
    await expect(page.locator(`[title="${file1Name}"]`)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(`[title="${file2Name}"]`)).toBeVisible({
      timeout: 10_000,
    });

    // Select both files via Ctrl+click (so handleItemDragStart includes both)
    await page.locator(`[data-item-id="${file1Id}"]`).click();
    await page
      .locator(`[data-item-id="${file2Id}"]`)
      .click({ modifiers: ['Control'] });

    // Small wait for React state to settle
    await page.waitForTimeout(200);

    // Drag file1 (which is in the selection) into target folder
    await simulateDragAndDrop(
      page,
      `[data-item-id="${file1Id}"]`,
      `[data-item-id="${targetId}"]`,
      [
        { id: file1Id, type: 'file' },
        { id: file2Id, type: 'file' },
      ]
    );

    // Verify toast for multiple items
    await waitForToast(page, '2 itens movidos com sucesso');

    // Both files should disappear
    await expect(page.locator(`[title="${file1Name}"]`)).not.toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(`[title="${file2Name}"]`)).not.toBeVisible({
      timeout: 10_000,
    });

    // Verify via API
    const contents = await getFolderContentsViaApi(userToken, targetId);
    expect(contents.files.find(f => f.name === file1Name)).toBeTruthy();
    expect(contents.files.find(f => f.name === file2Name)).toBeTruthy();
  });

  // ─── Drag onto system folder should NOT work ───────────────────────
  test('DnD-5 - Não permitir arrastar para pasta do sistema', async ({
    page,
  }) => {
    const ts = Date.now();
    const userFolderName = `e2e-dnd5-user-${ts}`;

    // Create a user folder at root level (siblings with system folders)
    const userFolderId = await createTestFolder(userToken, userFolderName);

    // Find a system folder at root level
    const rootContents = await getFolderContentsViaApi(userToken);
    const systemFolder = rootContents.folders.find(f => f.isSystem);
    if (!systemFolder) {
      test.skip();
      return;
    }

    const systemContentsBefore = await getFolderContentsViaApi(
      userToken,
      systemFolder.id
    );

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Both user folder and system folder should be visible at root
    await expect(page.locator(`[title="${userFolderName}"]`)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator(`[title="${systemFolder.name}"]`).first()
    ).toBeVisible({
      timeout: 10_000,
    });

    // Try to drag user folder onto system folder — the isSystem guard
    // should prevent the drop handler from running (no preventDefault on dragover).
    // We simulate the full sequence and verify nothing happened.
    const sourceWrapper = page.locator(`[data-item-id="${userFolderId}"]`);
    const targetWrapper = page
      .locator(`[data-item-id]:has([title="${systemFolder.name}"])`)
      .first();
    const targetDataId = await targetWrapper.getAttribute('data-item-id');

    await simulateDragAndDrop(
      page,
      `[data-item-id="${userFolderId}"]`,
      `[data-item-id="${targetDataId}"]`,
      [{ id: userFolderId, type: 'folder' }]
    );

    // No toast should appear — wait a bit and verify
    await page.waitForTimeout(2_000);

    // Verify user folder is still at root (not moved into system folder)
    const rootContentsAfter = await getFolderContentsViaApi(userToken);
    const stillAtRoot = rootContentsAfter.folders.find(
      f => f.name === userFolderName
    );
    expect(stillAtRoot).toBeTruthy();

    // Verify system folder contents unchanged
    const systemContentsAfter = await getFolderContentsViaApi(
      userToken,
      systemFolder.id
    );
    expect(systemContentsAfter.folders.length).toBe(
      systemContentsBefore.folders.length
    );
  });

  // ─── Drag in list view ─────────────────────────────────────────────
  test('DnD-6 - Arrastar arquivo para pasta na visualização de lista', async ({
    page,
  }) => {
    const ts = Date.now();
    const parentName = `e2e-dnd6-parent-${ts}`;
    const targetName = `e2e-dnd6-target-${ts}`;
    const fileName = `dnd6-file-${ts}.txt`;

    // Setup
    const parentId = await createTestFolder(userToken, parentName);
    const targetId = await createTestFolder(userToken, targetName, parentId);
    const fileId = await uploadTestFile(userToken, parentId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into parent
    await doubleClickItem(page, parentName);
    await expect(page.locator(`[title="${targetName}"]`)).toBeVisible({
      timeout: 10_000,
    });

    // Switch to list view
    await page.locator('button:has(svg.lucide-list)').click();
    await page.waitForTimeout(500);

    // Verify table view is active
    await expect(
      page.locator(
        'th:has-text("Nome"), [role="columnheader"]:has-text("Nome")'
      )
    ).toBeVisible({ timeout: 5_000 });

    // In list view, rows are <tr> inside <tbody>.
    // The file row contains the file name; the folder row contains the folder name.
    // We need to find the correct <tr> elements.
    // Drag the file row onto the folder row.
    await page.evaluate(
      ({ fileId, targetId, targetName, fileName, mime }) => {
        // Find source row (file) — look for a tr that contains the file name
        const rows = document.querySelectorAll('tbody tr');
        let sourceRow: Element | null = null;
        let targetRow: Element | null = null;

        for (const row of rows) {
          const text = row.textContent ?? '';
          if (text.includes(fileName) && !sourceRow) {
            sourceRow = row;
          }
          if (text.includes(targetName) && !targetRow) {
            targetRow = row;
          }
        }

        if (!sourceRow)
          throw new Error(`Source row for "${fileName}" not found`);
        if (!targetRow)
          throw new Error(`Target row for "${targetName}" not found`);

        // Create DataTransfer stub
        const dataStore: Record<string, string> = {};
        const dt = new DataTransfer();
        const origSetData = dt.setData.bind(dt);
        const origGetData = dt.getData.bind(dt);
        dt.setData = (format: string, data: string) => {
          dataStore[format] = data;
          try {
            origSetData(format, data);
          } catch {
            /* noop */
          }
        };
        dt.getData = (format: string) =>
          dataStore[format] ?? origGetData(format);
        Object.defineProperty(dt, 'types', {
          get: () => Object.keys(dataStore),
        });

        dt.setData(mime, JSON.stringify([{ id: fileId, type: 'file' }]));
        dt.effectAllowed = 'move';

        sourceRow.dispatchEvent(
          new DragEvent('dragstart', { dataTransfer: dt, bubbles: true })
        );
        targetRow.dispatchEvent(
          new DragEvent('dragenter', { dataTransfer: dt, bubbles: true })
        );
        targetRow.dispatchEvent(
          new DragEvent('dragover', { dataTransfer: dt, bubbles: true })
        );
        targetRow.dispatchEvent(
          new DragEvent('drop', { dataTransfer: dt, bubbles: true })
        );
        sourceRow.dispatchEvent(
          new DragEvent('dragend', { dataTransfer: dt, bubbles: true })
        );
      },
      { fileId, targetId, targetName, fileName, mime: DRAG_MIME }
    );

    // Verify toast
    await waitForToast(page, 'Item movido com sucesso');

    // Verify via API
    const contents = await getFolderContentsViaApi(userToken, targetId);
    expect(contents.files.find(f => f.name === fileName)).toBeTruthy();
  });
});
