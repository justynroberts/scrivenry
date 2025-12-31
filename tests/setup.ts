import puppeteer, { Browser, Page } from 'puppeteer'

const BASE_URL = 'http://localhost:3847'

let browser: Browser
let page: Page

export async function setup() {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  return { browser, page }
}

export async function teardown() {
  if (browser) {
    await browser.close()
  }
}

export async function login(page: Page, email = 'test@example.com', password = 'password123') {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('input[name="email"]')
  await page.type('input[name="email"]', email)
  await page.type('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle0' })
}

export async function register(page: Page, name: string, email: string, password: string) {
  await page.goto(`${BASE_URL}/register`)
  await page.waitForSelector('input[name="name"]')
  await page.type('input[name="name"]', name)
  await page.type('input[name="email"]', email)
  await page.type('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle0' })
}

export async function createPage(page: Page, title?: string) {
  // Click the + button in sidebar to create a new page
  await page.waitForSelector('[data-testid="sidebar-create-page"]', { visible: true })
  await wait(300) // Ensure element is stable
  await page.click('[data-testid="sidebar-create-page"]')

  // Wait for page editor to appear (client-side navigation)
  await page.waitForSelector('[data-testid="page-title"]', { visible: true, timeout: 15000 })
  await wait(500) // Wait for page to stabilize after navigation

  if (title) {
    // Clear and type the new title
    await page.waitForSelector('[data-testid="page-title"]', { visible: true })
    await page.click('[data-testid="page-title"]', { clickCount: 3 }) // Select all
    await page.keyboard.type(title)
    await page.keyboard.press('Tab') // Blur to save
    await wait(300)
  }
}

export async function waitForTestId(page: Page, testId: string, timeout = 5000) {
  return page.waitForSelector(`[data-testid="${testId}"]`, { timeout })
}

export async function clickTestId(page: Page, testId: string) {
  await waitForTestId(page, testId)
  await page.click(`[data-testid="${testId}"]`)
}

export async function hasTestId(page: Page, testId: string): Promise<boolean> {
  const element = await page.$(`[data-testid="${testId}"]`)
  return element !== null
}

export async function getTestIdText(page: Page, testId: string): Promise<string> {
  await waitForTestId(page, testId)
  const element = await page.$(`[data-testid="${testId}"]`)
  if (!element) return ''
  return page.evaluate(el => el.textContent || '', element)
}

export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export { BASE_URL }
