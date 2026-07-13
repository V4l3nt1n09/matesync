#!/usr/bin/env node
// Posts a tweet to X (formerly Twitter) via API v2 using OAuth 1.0a user-context auth.
// Usage: node post-to-x.mjs "Texte du tweet" [chemin/vers/image.png]
//        node post-to-x.mjs --delete <tweet_id>
// Requires X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET in the environment
// (source automation/.env before running).

import { createHmac, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";

const API_URL = "https://api.x.com/2/tweets";
const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";

function pctEncode(str) {
  return encodeURIComponent(str).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function buildAuthHeader(method, url, credentials) {
  const oauthParams = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };

  const paramString = Object.keys(oauthParams)
    .sort()
    .map((key) => `${pctEncode(key)}=${pctEncode(oauthParams[key])}`)
    .join("&");

  const baseString = [method.toUpperCase(), pctEncode(url), pctEncode(paramString)].join(
    "&",
  );

  const signingKey = `${pctEncode(credentials.apiSecret)}&${pctEncode(credentials.accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const headerParams = { ...oauthParams, oauth_signature: signature };
  const header =
    "OAuth " +
    Object.keys(headerParams)
      .sort()
      .map((key) => `${pctEncode(key)}="${pctEncode(headerParams[key])}"`)
      .join(", ");

  return header;
}

function getCredentials() {
  const credentials = {
    apiKey: process.env.X_API_KEY,
    apiSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
  };
  for (const [key, value] of Object.entries(credentials)) {
    if (!value) {
      throw new Error(`Missing credential: ${key} (check automation/.env is sourced)`);
    }
  }
  return credentials;
}

async function uploadMedia(imagePath, credentials) {
  const imageBuffer = await readFile(imagePath);
  const authHeader = buildAuthHeader("POST", MEDIA_UPLOAD_URL, credentials);

  const form = new FormData();
  form.append("media", new Blob([imageBuffer], { type: "image/png" }), "image.png");

  const response = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: authHeader },
    body: form,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`X media upload error (${response.status}): ${JSON.stringify(body)}`);
  }
  return body.media_id_string;
}

async function postTweet(text, imagePath) {
  const credentials = getCredentials();
  const mediaId = imagePath ? await uploadMedia(imagePath, credentials) : null;

  const authHeader = buildAuthHeader("POST", API_URL, credentials);
  const payload = mediaId ? { text, media: { media_ids: [mediaId] } } : { text };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`X API error (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function deleteTweet(id) {
  const credentials = getCredentials();
  const url = `${API_URL}/${id}`;
  const authHeader = buildAuthHeader("DELETE", url, credentials);

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: authHeader },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`X API error (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

const [arg1, arg2] = process.argv.slice(2);

try {
  if (arg1 === "--delete") {
    if (!arg2) {
      console.error("Usage: node post-to-x.mjs --delete <tweet_id>");
      process.exit(1);
    }
    const result = await deleteTweet(arg2);
    console.log("Tweet supprimé :", result.data.deleted);
  } else {
    if (!arg1) {
      console.error('Usage: node post-to-x.mjs "Texte du tweet" [chemin/image.png]');
      process.exit(1);
    }
    const result = await postTweet(arg1, arg2);
    console.log("Tweet publié :", result.data.id);
    console.log(`https://x.com/matesync/status/${result.data.id}`);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
