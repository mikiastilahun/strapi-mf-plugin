import type { ExportedLayout, PageLayout } from "./types";

// STRAPI_URL is injected by Rspack DefinePlugin at build time
declare const __STRAPI_URL__: string;
const STRAPI_URL =
  typeof __STRAPI_URL__ !== "undefined"
    ? __STRAPI_URL__
    : "http://localhost:1337";

/**
 * Fetch a layout by its document ID with all component information
 */
export async function fetchLayoutById(
  documentId: string,
): Promise<ExportedLayout> {
  console.log("[API] Fetching layout by ID:", documentId);

  const response = await fetch(
    `${STRAPI_URL}/mf-plugin/layouts/${documentId}/export`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch layout: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  console.log("[API] Layout export response:", data);

  return data as ExportedLayout;
}

/**
 * Fetch a layout by its slug
 */
export async function fetchLayoutBySlug(
  slug: string,
): Promise<ExportedLayout | null> {
  console.log("[API] Fetching layout by slug:", slug);

  // First, get all layouts and find the one with matching slug
  const response = await fetch(`${STRAPI_URL}/mf-plugin/layouts`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch layouts: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  const layouts: PageLayout[] = Array.isArray(data) ? data : data.data || [];
  const layout = layouts.find((l) => l.slug === slug);

  if (!layout) {
    console.log("[API] Layout not found for slug:", slug);
    return null;
  }

  // Now fetch the full exported layout
  return fetchLayoutById(layout.documentId);
}

/**
 * Fetch all available layouts
 */
export async function fetchAllLayouts(): Promise<PageLayout[]> {
  console.log(
    "[API] Fetching layouts from:",
    `${STRAPI_URL}/mf-plugin/layouts`,
  );

  const response = await fetch(`${STRAPI_URL}/mf-plugin/layouts`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch layouts: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  console.log("[API] Layouts response:", data);

  // Ensure we always return an array
  if (Array.isArray(data)) {
    return data;
  }

  // Handle Strapi's typical response format with data wrapper
  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  // Handle other possible formats
  if (data && typeof data === "object") {
    console.warn("[API] Unexpected response format:", data);
    return [];
  }

  return [];
}
