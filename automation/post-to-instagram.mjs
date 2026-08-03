#!/usr/bin/env node
// Publie une image sur Instagram via l'API Graph (compte business).
// Usage: node post-to-instagram.mjs "Légende du post" "https://url.publique/image.png"
// Requires INSTAGRAM_BUSINESS_ACCOUNT_ID_GRAPH, INSTAGRAM_ACCESS_TOKEN in the environment
// (source automation/.env before running).

const GRAPH_API = "https://graph.facebook.com/v20.0";

function getCredentials() {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID_GRAPH;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    throw new Error(
      "Missing INSTAGRAM_BUSINESS_ACCOUNT_ID_GRAPH or INSTAGRAM_ACCESS_TOKEN (check automation/.env is sourced)",
    );
  }
  return { igUserId, accessToken };
}

async function createContainer(caption, imageUrl, credentials) {
  const url = new URL(`${GRAPH_API}/${credentials.igUserId}/media`);
  url.searchParams.set("image_url", imageUrl);
  url.searchParams.set("caption", caption);
  url.searchParams.set("access_token", credentials.accessToken);

  const response = await fetch(url, { method: "POST" });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Instagram container error (${response.status}): ${JSON.stringify(body)}`);
  }
  return body.id;
}

async function publishContainer(creationId, credentials) {
  const url = new URL(`${GRAPH_API}/${credentials.igUserId}/media_publish`);
  url.searchParams.set("creation_id", creationId);
  url.searchParams.set("access_token", credentials.accessToken);

  const response = await fetch(url, { method: "POST" });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Instagram publish error (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

const [caption, imageUrl] = process.argv.slice(2);

try {
  if (!caption || !imageUrl) {
    console.error('Usage: node post-to-instagram.mjs "Légende" "https://url.publique/image.png"');
    process.exit(1);
  }
  const credentials = getCredentials();
  const creationId = await createContainer(caption, imageUrl, credentials);
  const result = await publishContainer(creationId, credentials);
  console.log("Post Instagram publié, media id :", result.id);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
