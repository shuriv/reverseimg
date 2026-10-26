export async function openUrl(url: string, newTab = true): Promise<void> {
  if (newTab) {
    await browser.tabs.create({ url });
    return;
  }
  try {
    await browser.tabs.update({ url });
  } catch {
    await browser.tabs.create({ url });
  }
}

export function uploadPageUrl(engineId: string, pendingId: string): string {
  const params = new URLSearchParams({ engine: engineId, id: pendingId });
  return browser.runtime.getURL(`upload.html?${params.toString()}`);
}

export function errorPageUrl(code: string, engineId?: string): string {
  const params = new URLSearchParams({ code });
  if (engineId) {
    params.set("engine", engineId);
  }
  return browser.runtime.getURL(`error.html?${params.toString()}`);
}

export async function openUploadPage(
  engineId: string,
  pendingId: string,
  newTab = true
): Promise<void> {
  await openUrl(uploadPageUrl(engineId, pendingId), newTab);
}

export async function openErrorPage(
  code: string,
  engineId?: string,
  newTab = true
): Promise<void> {
  await openUrl(errorPageUrl(code, engineId), newTab);
}
