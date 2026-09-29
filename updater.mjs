/* Daily Emoji Mix Repo Gist By @mikroskato62 */

// 1. Imports:
import { randomInt } from "node:crypto";

// 2. Configuration & Environment Variables:
const emojiCount = 3;
const unicodeEmojiTestUrl = "https://www.unicode.org/Public/emoji/latest/emoji-test.txt";
const timeZone = "Etc/GMT-3";
const gistId = process.env.GIST_ID?.trim();
const token = process.env.GH_TOKEN?.trim();
const filename = process.env.GIST_FILENAME?.trim() || "emojis.md";

// 3. Environment Validation:
if (!gistId) throw new Error("[Error] Missing GIST_ID Actions Variable ...");
if (!token) throw new Error("[Error] Missing GH_TOKEN Actions Secret ...");

// 4. Helper Functions:
/* A. Fetches the official unicode emoji list and filters to exclude all flags ... */
async function loadEmojiPool()
{
  const response = await fetch(unicodeEmojiTestUrl, {headers: { Accept: "text/plain" }});
  if (!response.ok) { throw new Error(`[Error] Unicode emoji data request failed: HTTP ${response.status} ...`); }
  const source = await response.text();
  let group = "";
  const emojiPool = new Set();
  for (const line of source.split(/\r?\n/)) 
  {
    const groupMatch = line.match(/^#\s*group:\s*(.+)$/);
    if (groupMatch) { group = groupMatch[1].trim(); continue; }
    if (group.toLowerCase() === "flags") continue;
    const entry = line.match(/^([0-9A-F ]+)\s*;\s*([a-z-]+)\s*#/);
    if (!entry || entry[2] !== "fully-qualified") continue;
    const codePoints = entry[1].trim().split(/\s+/).map((value) => Number.parseInt(value, 16));
    emojiPool.add(String.fromCodePoint(...codePoints));
  }
  if (emojiPool.size < emojiCount) { throw new Error(`[Error] Unicode emoji data produced an unexpectedly small pool (${emojiPool.size}) ...`); }
  return [...emojiPool];
}
/* B. Extracts year, month, and day based on the specified time zone ... */
function getDateParts(date, zone) 
{
  const parts = new Intl.DateTimeFormat("en", {timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}
/* C. Formats the calendar date and ordinal day-of-year metadata ... */
function formatDateInfo(parts) 
{
  const { year, month, day } = parts;
  const localDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfYear = Math.floor((localDate.getTime() - Date.UTC(year, 0, 1)) / 86_400_000) + 1;
  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  return {
    date: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    ordinalDay: `${dayOfYear}/${daysInYear}`,
  };
}

// 5. Random Emoji Selection:
const now = new Date();
const { date, ordinalDay } = formatDateInfo(getDateParts(now, timeZone));
const emojiPool = await loadEmojiPool();
const pool = [...emojiPool];
const selection = [];
for (let i = 0; i < emojiCount; i++) 
{
  const index = randomInt(pool.length);
  selection.push(pool.splice(index, 1)[0]);
}

// 6. Gist Description and Markdown Content Composition:
const description = `[${ordinalDay}] Today’s Emojis (${date})`;
const content = selection.join("\n");

// 7. GitHub Gist API Request:
const gistResponse = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
  method: "PATCH",
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "daily-emoji-mix",
  },
  body: JSON.stringify({ description, files: { [filename]: { content } } }),
});
if (!gistResponse.ok) { const detail = await gistResponse.text(); throw new Error(`[Error] GitHub Gist API returned ${gistResponse.status}: ${detail}`); }
console.log(`[Success] Updated ${filename} in Gist ${gistId} for ${date} (${timeZone}) ...`);

/* The End Of Daily Emoji Mix Repo Gist */