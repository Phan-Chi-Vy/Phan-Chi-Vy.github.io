import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "index.html");
const outputPath = resolve(root, "about.html");
const rootUrl = "https://hoshimiya.dev/";
const profileUrl = `${rootUrl}about.html`;
const profileTitle = "About Phan Chi Vy (Phan Chí Vỹ) | Yozora / Kyokkei";
const profileDescription = "About Phan Chi Vy (Phan Chí Vỹ), known as Yozora or Kyokkei: an IC Design student at IUH and independent software developer in Ho Chi Minh City, Vietnam.";

const replaceOnce = (source, search, replacement, label) => {
  if (!source.includes(search)) throw new Error(`Could not find ${label} in index.html`);
  return source.replace(search, replacement);
};

let html = await readFile(sourcePath, "utf8");
html = replaceOnce(html, '<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta name="viewport" content="width=device-width, initial-scale=1">\n  <base href="/">', "viewport metadata");
html = replaceOnce(html, '<meta name="description" content="Phan Chi Vy (Phan Chí Vỹ), known as Yozora or Kyokkei, is an IC Design student at IUH and an independent software developer in Ho Chi Minh City, Vietnam.">', `<meta name="description" content="${profileDescription}">`, "description metadata");
html = replaceOnce(html, "<title>Phan Chi Vy (Phan Chí Vỹ) | Yozora / Kyokkei</title>", `<title>${profileTitle}</title>`, "title");
html = replaceOnce(html, '<link rel="canonical" href="https://hoshimiya.dev/">', `<link rel="canonical" href="${profileUrl}">`, "canonical URL");
html = replaceOnce(html, '<meta property="og:url" content="https://hoshimiya.dev/">', `<meta property="og:url" content="${profileUrl}">`, "Open Graph URL");
html = replaceOnce(html, '<meta property="og:title" content="Phan Chi Vy (Phan Chí Vỹ) | Yozora / Kyokkei">', `<meta property="og:title" content="${profileTitle}">`, "Open Graph title");
html = replaceOnce(html, '<meta property="og:description" content="Who is Phan Chi Vy? Phan Chí Vỹ, known as Yozora or Kyokkei, is an IC Design student at IUH and an independent software developer in Ho Chi Minh City, Vietnam.">', `<meta property="og:description" content="${profileDescription}">`, "Open Graph description");
html = replaceOnce(html, '<meta name="twitter:url" content="https://hoshimiya.dev/">', `<meta name="twitter:url" content="${profileUrl}">`, "Twitter URL");
html = replaceOnce(html, '<meta name="twitter:title" content="Phan Chi Vy (Phan Chí Vỹ) | Yozora / Kyokkei">', `<meta name="twitter:title" content="${profileTitle}">`, "Twitter title");
html = replaceOnce(html, '<meta name="twitter:description" content="Who is Phan Chi Vy? Phan Chí Vỹ, known as Yozora or Kyokkei, is an IC Design student at IUH and an independent software developer in Ho Chi Minh City, Vietnam.">', `<meta name="twitter:description" content="${profileDescription}">`, "Twitter description");

const schemaBlock = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
if (!schemaBlock) throw new Error("Could not find JSON-LD in index.html");
const schema = JSON.parse(schemaBlock[1]);
const profile = schema["@graph"].find((node) => node["@type"] === "ProfilePage");
const person = schema["@graph"].find((node) => node["@type"] === "Person");
if (!profile || !person) throw new Error("ProfilePage or Person entity is missing from index.html JSON-LD");
profile["@id"] = `${profileUrl}#profile`;
profile.url = profileUrl;
profile.name = profileTitle;
person.mainEntityOfPage = { "@id": profile["@id"] };
html = html.replace(schemaBlock[0], `<script type="application/ld+json">\n  ${JSON.stringify(schema, null, 2).replaceAll("\n", "\n  ")}\n  </script>`);

html = replaceOnce(html, "<body>", '<body data-initial-page="identity">', "body bootstrap marker");
html = replaceOnce(html, '<a class="skip-link" href="#home">Skip to main content</a>', '<a class="skip-link" href="/about.html#page-identity">Skip to main content</a>', "skip link");
html = replaceOnce(html, '<section class="app-page home-page is-active" id="page-home" data-page="home" aria-labelledby="hero-title">', '<section class="app-page home-page" id="page-home" data-page="home" aria-labelledby="hero-title" aria-hidden="true" inert>', "home page state");
html = replaceOnce(html, '<section class="app-page identity-page" id="page-identity" data-page="identity" aria-labelledby="identity-title" aria-hidden="true" inert>', '<section class="app-page identity-page is-active" id="page-identity" data-page="identity" aria-labelledby="identity-title" tabindex="-1">', "identity page state");
html = replaceOnce(html, '<a class="dock-link is-active" href="/#home" data-route="home" aria-current="page">', '<a class="dock-link" href="/#home" data-route="home">', "home dock state");
html = replaceOnce(html, '<a class="dock-link" href="/about.html" data-route="identity">', '<a class="dock-link is-active" href="/about.html" data-route="identity" aria-current="page">', "identity dock state");
html = replaceOnce(html, '<nav class="app-dock glass-panel" aria-label="Main navigation" data-navigation>', '<nav class="app-dock glass-panel" aria-label="Main navigation" data-navigation data-initial-route="identity">', "initial dock route");

await writeFile(outputPath, html, "utf8");
console.log(`Generated ${outputPath}`);
