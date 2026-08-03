#!/usr/bin/env node
// Publie une image sur Instagram via l'API Instagram avec connexion Instagram
// (Instagram API with Instagram Login — pas de Page Facebook nécessaire).
// Usage: node post-to-instagram.mjs "Légende du post" "https://url.publique/image.png"
// Requires INSTAGRAM_USER_ID, INSTAGRAM_ACCESS_TOKEN (token IGAA...) in the environment
// (source automation/.env before running).

const GRAPH_API = "https://graph.instagram.com/v20.0";

function getCredentials() {
  const igUserId = process.env.INSTAGRAM_USER_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    throw new Error(
      "Missing INSTAGRAM_USER_ID or INSTAGRAM_ACCESS_TOKEN (check automation/.env is sourced)",
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

async function waitUntilReady(creationId, credentials) {
  const url = new URL(`${GRAPH_API}/${creationId}`);
  url.searchParams.set("fields", "status_code");
  url.searchParams.set("access_token", credentials.accessToken);

  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await fetch(url);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(`Instagram status check error (${response.status}): ${JSON.stringify(body)}`);
    }
    if (body.status_code === "FINISHED") return;
    if (body.status_code === "ERROR") {
      throw new Error(`Instagram container processing failed: ${JSON.stringify(body)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error("Instagram container still not ready after 30s");
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
  await waitUntilReady(creationId, credentials);
  const result = await publishContainer(creationId, credentials);
  console.log("Post Instagram publié, media id :", result.id);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
