import { expect, test } from '@playwright/test';

test.describe('SIPPAT - Fase 1 (Setup)', () => {
  test('deve carregar a página inicial exibindo o título SIPPAT', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'SIPPAT' })).toBeVisible();
  });

  test('deve exibir algum status de conexão com a API (ok ou erro)', async ({ page }) => {
    await page.goto('/');

    const statusText = page.locator('text=/API e banco de dados conectados|Não foi possível conectar à API/');
    await expect(statusText).toBeVisible({ timeout: 10_000 });
  });
});
