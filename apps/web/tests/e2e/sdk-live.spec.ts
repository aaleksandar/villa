/**
 * SDK Live Integration Test
 *
 * Tests the actual SDK iframe flow on the deployed environment.
 */

import { test, expect } from '@playwright/test'

test.describe('SDK Live - Demo Page', () => {
  test('SDK demo page loads and shows sign in button', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Page should load
    await expect(page).toHaveTitle(/Villa/)

    // Should have sign in button
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await expect(signInButton.first()).toBeVisible({ timeout: 10000 })
  })

  test('clicking sign in opens VillaAuth modal', async ({ page }) => {
    await page.goto('/sdk-demo')

    // Click sign in button
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await signInButton.first().click()

    // Should see VillaAuth modal appear (not iframe - it's a local component)
    // The modal contains the VillaAuth component which shows welcome screen
    await expect(page.locator('text=/create.*villa.*id|welcome/i').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('SDK Live - Iframe Test Page', () => {
  test('iframe test page loads', async ({ page }) => {
    await page.goto('/sdk-demo/iframe-test')

    // Page should show "Open Auth Iframe" button
    const openButton = page.getByRole('button', { name: /open auth iframe/i })
    await expect(openButton).toBeVisible({ timeout: 10000 })
  })

  test('clicking button opens auth iframe', async ({ page }) => {
    await page.goto('/sdk-demo/iframe-test')

    // Click the open auth iframe button
    const openButton = page.getByRole('button', { name: /open auth iframe/i })
    await openButton.click()

    // Should see auth iframe appear
    const iframe = page.locator('iframe[src*="/auth"]')
    await expect(iframe).toBeVisible({ timeout: 10000 })

    // Iframe should have correct permissions for passkeys
    const allow = await iframe.getAttribute('allow')
    expect(allow).toContain('publickey-credentials')
  })

  test('auth page loads in iframe with correct content', async ({ page }) => {
    await page.goto('/sdk-demo/iframe-test')

    // Click the open auth iframe button
    const openButton = page.getByRole('button', { name: /open auth iframe/i })
    await openButton.click()

    // Wait for iframe
    const iframe = page.locator('iframe[src*="/auth"]')
    await expect(iframe).toBeVisible({ timeout: 10000 })

    // Get iframe content
    const frame = page.frameLocator('iframe[src*="/auth"]')

    // Should show Villa branding or auth options
    const villaContent = frame.locator('text=/villa|sign in|create/i')
    await expect(villaContent.first()).toBeVisible({ timeout: 15000 })
  })

  test('postMessage logs are displayed', async ({ page }) => {
    await page.goto('/sdk-demo/iframe-test')

    // Click the open auth iframe button
    const openButton = page.getByRole('button', { name: /open auth iframe/i })
    await openButton.click()

    // Should see logs appear in the log panel
    await expect(page.locator('text=/opening auth iframe/i')).toBeVisible({ timeout: 5000 })
  })
})
