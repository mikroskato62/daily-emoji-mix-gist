/* Daily Emoji Mix Repo Gist By @mikroskato62 */

// 1. Imports:
import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";

// 2. Configuration & Environment Variables:
let config = {};
try { config = JSON.parse(readFileSync(new URL("./config.json", import.meta.url), "utf8")); } 
catch { config = {}; }
const gistId = process.env.GIST_ID?.trim();
const token = process.env.GH_TOKEN?.trim();
const timeZone = process.env.TIMEZONE?.trim() || config.timeZone || "Etc/GMT-3";
const filename = process.env.GIST_FILENAME?.trim() || config.gistFilename || "emojis.md";
const excludedGroups = (config.excludedGroups ?? ["Flags"]).map((g) => g.toLowerCase());
const excludedSubgroups = (config.excludedSubgroups ?? []).map((sg) => sg.toLowerCase());
const unicodeEmojiTestUrl = config.emojiSourceUrl || config.unicodeEmojiTestUrl || "https://www.unicode.org/Public/emoji/latest/emoji-test.txt";
const maxEmojiVersionRaw = process.env.MAX_EMOJI_VERSION ?? config.maxEmojiVersion;
const maxEmojiVersion = maxEmojiVersionRaw === null || maxEmojiVersionRaw === "null" || maxEmojiVersionRaw === "none" ? null : (maxEmojiVersionRaw !== undefined ? Number.parseFloat(maxEmojiVersionRaw) : 15.1);

// 3. Environment Validation:
if (!gistId) throw new Error("[Error] Missing GIST_ID Actions Variable ...");
if (!token) throw new Error("[Error] Missing GH_TOKEN Actions Secret ...");

// 4. Layout & Dimension Resolution:
const isRandomMode = config.randomize === true;
let rows = resolveValue(config.rows, isRandomMode ? randomInt(1, 6) : null);
let columns = resolveValue(config.columns, isRandomMode ? randomInt(1, 18) : null);
let emojiCount = Number(process.env.EMOJI_COUNT) || null;
if (!emojiCount && config.emojiCount && config.emojiCount !== "auto") { emojiCount = resolveValue(config.emojiCount, null); }
const isBox = config.style === "box" || config.box === true;
if (isBox) 
{
  rows = rows || 5;
  columns = columns || 17;
  if (!emojiCount) { emojiCount = columns * 2 + Math.max(0, rows - 2) * 2; }
}

if (!emojiCount) 
{
  if (rows && columns) { emojiCount = rows * columns; }
  else if (rows) { columns = 1; emojiCount = rows; }
  else if (columns) { rows = 1; emojiCount = columns; }
  else { emojiCount = 3; rows = 3; columns = 1; }
} 
else if (rows && !columns) 
{
  columns = Math.ceil(emojiCount / rows);
} 
else if (columns && !rows) 
{
  rows = Math.ceil(emojiCount / columns);
}

// 5. Helper Functions:
/* A. Fetches the official unicode emoji list and filters based on configuration ... */
async function loadEmojiPool()
{
  const response = await fetch(unicodeEmojiTestUrl, {headers: { Accept: "text/plain" }});
  if (!response.ok) { throw new Error(`[Error] Unicode emoji data request failed: HTTP ${response.status} ...`); }
  const source = await response.text();
  let group = "";
  let subgroup = "";
  const emojiPool = new Set();
  for (const line of source.split(/\r?\n/)) 
  {
    const groupMatch = line.match(/^#\s*group:\s*(.+)$/);
    if (groupMatch) { group = groupMatch[1].trim(); subgroup = ""; continue; }
    const subgroupMatch = line.match(/^#\s*subgroup:\s*(.+)$/);
    if (subgroupMatch) { subgroup = subgroupMatch[1].trim(); continue; }
    if (excludedGroups.includes(group.toLowerCase())) continue;
    if (excludedSubgroups.includes(subgroup.toLowerCase())) continue;
    const entry = line.match(/^([0-9A-F ]+)\s*;\s*([a-z-]+)\s*#/);
    if (!entry || entry[2] !== "fully-qualified") continue;
    if (maxEmojiVersion !== null) 
    {
      const versionMatch = line.match(/#\s*\S+\s+E(\d+(?:\.\d+)?)/);
      if (versionMatch && Number.parseFloat(versionMatch[1]) > maxEmojiVersion) continue;
    }
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
    dayOfYear,
    daysInYear,
    year,
    month: String(month).padStart(2, "0"),
    day: String(day).padStart(2, "0"),
  };
}
/* D. Replaces {variable} or ${variable} placeholders in template strings ... */
function formatTemplate(template, vars) 
{
  return template.replace(/\$?\{([\w-]+)\}/g, (_, key) => vars[key] ?? "");
}
/* E. Resolves fixed numbers, [min, max] range arrays, or fallbacks ... */
function resolveValue(val, fallback) 
{
  if (Array.isArray(val) && val.length === 2 && typeof val[0] === "number" && typeof val[1] === "number") 
  {
    const [min, max] = val[0] <= val[1] ? val : [val[1], val[0]];
    return randomInt(min, max + 1);
  }
  if (typeof val === "number" && val > 0) return val;
  return fallback;
}
/* F. Formats selected emojis into rows, columns, or custom layouts ... */
function formatContent(selection, config, columns, rows) 
{
  const colSep = config.columnSeparator ?? config.colSeparator ?? " ";
  const rowSep = config.rowSeparator ?? "\n";
  if (config.style === "box" || config.box === true) 
  {
    const r = rows || 5;
    const c = columns || 17;
    let middleSpacesCount = config.middleSpaces ?? config.boxPadding;
    if (typeof middleSpacesCount !== "number") 
    {
      middleSpacesCount = Math.round((c - 2) * (2.45 + colSep.length) + colSep.length);
    }
    const middleSpacing = typeof config.middleSpacing === "string" ? config.middleSpacing : " ".repeat(Math.max(1, middleSpacesCount));
    const resultRows = [];
    resultRows.push(selection.slice(0, c).join(colSep));
    let idx = c;
    for (let i = 0; i < r - 2; i++) 
    {
      const left = selection[idx++] || " ";
      const right = selection[idx++] || " ";
      resultRows.push(`${left}${middleSpacing}${right}`);
    }
    resultRows.push(selection.slice(idx, idx + c).join(colSep));
    return resultRows.join(rowSep);
  }
  if (Array.isArray(config.layout) && config.layout.length > 0) 
  {
    const rowsList = [];
    let poolIndex = 0;
    for (const count of config.layout) 
    {
      if (count === 0) 
      {
        rowsList.push("");
      } 
      else 
      {
        const slice = selection.slice(poolIndex, poolIndex + count);
        poolIndex += count;
        rowsList.push(slice.join(colSep));
      }
    }
    if (poolIndex < selection.length) { rowsList.push(selection.slice(poolIndex).join(colSep)); }
    return rowsList.join(rowSep);
  }
  const cols = columns || Number(config.columns) || 1;
  if (cols > 1) 
  {
    const rowsList = [];
    for (let i = 0; i < selection.length; i += cols) { rowsList.push(selection.slice(i, i + cols).join(colSep)); }
    return rowsList.join(rowSep);
  }
  const separator = config.separator ?? rowSep;
  return selection.join(separator);
}

// 6. Random Emoji Selection:
const now = new Date();
const dateInfo = formatDateInfo(getDateParts(now, timeZone));
const { date } = dateInfo;
const emojiPool = await loadEmojiPool();
const pool = [...emojiPool];
const selection = [];
for (let i = 0; i < emojiCount; i++) 
{
  const index = randomInt(pool.length);
  selection.push(pool.splice(index, 1)[0]);
}

// 7. Gist Description and Markdown Content Composition:
const titleTemplate = config.gistTitle || config.title || "[{ordinal-date}] Today's Emojis ({iso-date})";
const templateVars = {
  ...dateInfo,
  "ordinal-date": dateInfo.ordinalDay,
  "iso-date": dateInfo.date,
  "day-of-year": dateInfo.dayOfYear,
  "days-in-year": dateInfo.daysInYear,
  "emoji-count": emojiCount,
  rows: rows ?? 1,
  columns: columns ?? 1,
  emojiCount,
};
const description = formatTemplate(titleTemplate, templateVars);
const content = formatContent(selection, config, columns, rows);

// 8. GitHub Gist API Request:
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

/* Daily Emoji Mix Repo Gist By @mikroskato62 */