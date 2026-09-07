import { mkdir, readFile, readdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content", "insights");
const outputDir = path.join(root, "insights");
const siteUrl = "https://dascoda.com";
const buildVersion = "insights-framework-1";

const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));

const cleanHtml = (html) => html.replace(/[ \t]+(?=\r?\n)/g, "");

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const absoluteUrl = (url) => {
  if (!url) return siteUrl;
  if (url.startsWith("http")) return url;
  return `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

const articlePath = (slug) => `/insights/${slug}`;
const articleCanonical = (article) => `${siteUrl}${articlePath(article.slug)}`;

const slugify = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const editorialLabel = (article) => article.editorial_label || article.content_type.replaceAll("_", " ");

const renderEditorialImage = (image, frameClass, imageClass, options = {}) => {
  if (!image?.src) return "";

  const loading = options.loading || "lazy";
  const fetchPriority = options.fetchPriority ? ` fetchpriority="${escapeHtml(options.fetchPriority)}"` : "";
  const srcset = Array.isArray(image.srcset) && image.srcset.length
    ? ` srcset="${escapeHtml(image.srcset.map(({ src, width }) => `${src} ${width}w`).join(", "))}"`
    : "";
  const mobileSource = image.mobile_src
    ? `<source media="(max-width: 640px)" srcset="${escapeHtml(image.mobile_src)}">`
    : "";
  const width = Number.isFinite(image.width) ? image.width : 2400;
  const height = Number.isFinite(image.height) ? image.height : 1600;

  return `<picture class="insight-image-frame ${frameClass}">${mobileSource}<img class="${imageClass}" src="${escapeHtml(image.src)}"${srcset} sizes="${escapeHtml(options.sizes || "100vw")}" width="${width}" height="${height}" alt="${escapeHtml(image.alt || "")}" loading="${loading}"${fetchPriority}></picture>`;
};

const linkifyText = (value = "") =>
  escapeHtml(value).replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    const cleanUrl = url.replace(/[.,;)]$/, "");
    const trailing = url.slice(cleanUrl.length);
    return `<a href="${cleanUrl}" target="_blank" rel="noopener">${cleanUrl}</a>${trailing}`;
  });

const header = () => `
  <header class="site-header">
    <div class="container nav">
      <a class="brand-link" href="/" aria-label="Dascoda Solutions home"><img class="brand-logo" src="/assets/images/dascoda-logo.png" alt="Dascoda Solutions logo"><span class="brand-name">Dascoda Solutions</span></a>
      <nav class="nav-links" aria-label="Primary navigation">
        <a href="/">Home</a><a href="/solutions">Solutions</a><a href="/industries">Industries</a><a href="/partners">Partners</a><a class="active" href="/insights/">Insights</a><a href="/about">About</a><a href="/contact">Contact</a>
      </nav>
      <a class="btn btn-primary" href="/contact">Talk with Dascoda</a>
      <button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </header>`;

const footer = () => `
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a class="brand-link" href="/" aria-label="Dascoda Solutions home"><img class="brand-logo" src="/assets/images/dascoda-logo.png" alt="Dascoda Solutions logo"><span class="brand-name">Dascoda Solutions</span></a>
        <p class="footer-note">Technology Solutions. Trusted Guidance. Accountable Execution.</p>
        <p class="footer-legal">&copy; 2026 Dascoda Solutions <span aria-hidden="true">|</span> <a href="/privacy">Privacy Policy</a></p>
      </div>
      <div class="footer-links">
        <a href="/">Home</a><a href="/solutions">Solutions</a><a href="/industries">Industries</a><a href="/partners">Partners</a><a href="/insights/">Insights</a><a href="/about">About</a><a href="/contact">Contact</a><a class="footer-social" href="https://www.linkedin.com/company/dascoda-solutions" target="_blank" rel="noopener">LinkedIn</a>
      </div>
    </div>
  </footer>`;

const googleTag = () => `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-D4PTTET67Z"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-D4PTTET67Z');
  </script>`;

const pageShell = ({
  title,
  description,
  canonical,
  image,
  body,
  schema = "",
  robots = "index, follow",
  bodyClass = "",
  ogTitle = title,
  ogDescription = description,
  ogType = "website",
}) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${escapeHtml(absoluteUrl(image))}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:site_name" content="Dascoda Solutions">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${escapeHtml(absoluteUrl(image))}">
  ${schema}
  ${googleTag()}
  <link rel="stylesheet" href="/css/styles.css?v=${buildVersion}">
</head>
<body class="${escapeHtml(bodyClass)}">
${header()}
${body}
${footer()}
  <script src="/js/main.js?v=interactions-1"></script>
</body>
</html>
`;

const breadcrumbJsonLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

const articleJsonLd = (article) => {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${articleCanonical(article)}#article`,
    headline: article.title,
    description: article.dek,
    url: articleCanonical(article),
    author: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Dascoda Solutions",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Dascoda Solutions",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/assets/images/dascoda-logo.png`,
      },
    },
    image: absoluteUrl(article.og_image),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleCanonical(article),
    },
  };
  return data;
};

const schemaScript = (...objects) =>
  `<script type="application/ld+json">${JSON.stringify(objects.length === 1 ? objects[0] : objects, null, 2)}</script>`;

const renderArticleCard = (article, variant = "", options = {}) => `
  <article class="card insight-card ${variant}${options.step ? " insight-card-learning" : ""}">
    ${options.step ? `<div class="insight-learning-step"><span>${escapeHtml(options.step)}</span><small>${escapeHtml(options.stepLabel)}</small></div>` : ""}
    ${renderEditorialImage(article.image, "insight-card-image-frame", "insight-card-image", { sizes: "(max-width: 760px) calc(100vw - 40px), (max-width: 1080px) calc(50vw - 48px), 340px" })}
    <div class="insight-card-meta"><span>${escapeHtml(editorialLabel(article))}</span></div>
    <h3><a href="${articlePath(article.slug)}">${escapeHtml(article.title)}</a></h3>
    <p>${escapeHtml(article.dek)}</p>
    <a class="insight-card-link" href="${articlePath(article.slug)}">Read Insight</a>
  </article>`;

const renderBreadcrumbs = (items) => `
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    ${items.map((item, index) => index === items.length - 1
      ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
      : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a>`).join("<span aria-hidden=\"true\">/</span>")}
  </nav>`;

const renderBodyBlock = (block) => {
  switch (block.type) {
    case "h2":
      return `<h2 id="${escapeHtml(slugify(block.text))}">${escapeHtml(block.text)}</h2>`;
    case "h3":
      return `<h3>${escapeHtml(block.text)}</h3>`;
    case "paragraph":
      return `<p>${escapeHtml(block.text)}</p>`;
    case "source_note":
      return `<p class="insight-source-note-inline">${linkifyText(block.text)}</p>`;
    case "bullets":
      return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    case "pullquote":
      return `<figure class="insight-pullquote"><blockquote>${escapeHtml(block.text)}</blockquote>${block.attribution ? `<figcaption>${escapeHtml(block.attribution)}</figcaption>` : ""}</figure>`;
    case "stat_callout":
      return `<aside class="insight-stat-callout"><strong>${escapeHtml(block.value)}</strong><p>${escapeHtml(block.label)}</p>${block.source_id ? `<span>Source: ${escapeHtml(block.source_id)}</span>` : ""}</aside>`;
    case "table":
      return `<figure class="insight-table-wrap">${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}<div class="insight-table-scroll"><table><thead><tr>${block.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></figure>`;
    default:
      throw new Error(`Unsupported body block type: ${block.type}`);
  }
};

const renderSourceList = (article) => {
  const sources = article.sources || [];
  if (!sources.length && !article.source_note) return "";
  const heading = article.sources_heading || "Sources and Further Reading";
  const note = article.source_note ? `<p>${linkifyText(article.source_note)}</p>` : "";
  const list = sources.length ? `<ol>${sources.map((source) => `<li id="${escapeHtml(source.id)}">${source.text ? linkifyText(source.text) : `<strong>${escapeHtml(source.title)}</strong>${source.publisher ? `, ${escapeHtml(source.publisher)}` : ""}${source.url ? `. <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">View source</a>` : ""}`}</li>`).join("")}</ol>` : "";
  return `<section class="insight-sources"><h2>${escapeHtml(heading)}</h2>${note}${list}</section>`;
};

const renderRelatedInsights = (article, articleMap) => {
  const related = (article.related_slugs || []).map((slug) => articleMap.get(slug)).filter(Boolean);
  if (!related.length) return "";
  return `<section class="section section-blue related-insights"><div class="container"><div class="section-header"><p class="eyebrow">Related Insights</p><h2>Explore related perspectives.</h2></div><div class="grid grid-3">${related.map((item) => renderArticleCard(item)).join("")}</div></div></section>`;
};

const renderArticleCta = (cta) => `
  <section class="section"><div class="container"><div class="cta-band"><div><h2>${escapeHtml(cta.headline)}</h2><p>${escapeHtml(cta.copy)}</p></div><a class="btn btn-primary" href="${escapeHtml(cta.button_url)}">${escapeHtml(cta.button_text)}</a></div></div></section>`;

const renderOnThisPage = (article) => {
  if (!article.show_on_this_page) return "";
  const headings = article.body.filter((block) => block.type === "h2");
  if (!headings.length) return "";
  return `<nav class="insight-on-this-page" aria-label="On this page"><details open><summary>On This Page</summary><ol>${headings.map((block) => `<li><a href="#${escapeHtml(slugify(block.text))}">${escapeHtml(block.text)}</a></li>`).join("")}</ol></details></nav>`;
};

const renderLearningPath = (article, articleMap) => {
  if (article.next_slug) {
    const next = articleMap.get(article.next_slug);
    if (!next) return "";
    return `<section class="section insight-learning-path" id="continue-the-learning-path"><div class="container"><div class="insight-learning-path-inner"><div><p class="eyebrow">Continue the Learning Path</p><p class="insight-path-label">${escapeHtml(article.next_label || "Next Insight")}</p><h2>${escapeHtml(next.title)}</h2><p>${escapeHtml(next.dek)}</p></div><a class="btn btn-secondary" href="${articlePath(next.slug)}">Continue Reading</a></div></div></section>`;
  }
  if (article.next_cta) return renderArticleCta(article.next_cta);
  return "";
};

const renderLandingCluster = (cluster, articleMap) => {
  const items = cluster.items.map((item) => ({ ...item, article: articleMap.get(item.slug) })).filter((item) => item.article);
  const clusterImage = renderEditorialImage(cluster.image, "insights-cluster-image-frame", "insights-cluster-image", { sizes: "(max-width: 760px) calc(100vw - 40px), 420px" });
  const headerClass = clusterImage ? "insights-cluster-header" : "insights-cluster-header insights-cluster-header--text-only";
  return `<section class="section insights-cluster-section" id="${escapeHtml(cluster.id)}"><div class="container"><div class="${headerClass}">${clusterImage}<div><p class="eyebrow">${escapeHtml(cluster.eyebrow || "Learning Path")}</p><h2>${escapeHtml(cluster.headline)}</h2><p>${escapeHtml(cluster.description)}</p></div></div><div class="insight-learning-list">${items.map((item) => renderArticleCard(item.article, "", { step: item.step, stepLabel: item.step_label })).join("")}</div></div></section>`;
};

const renderLanding = (landing, articleMap) => {
  const body = `
  <main class="insights-page">
    <section class="hero insights-hero">
      <div class="container">
        <p class="eyebrow">${escapeHtml(landing.eyebrow)}</p>
        <h1>${escapeHtml(landing.headline)}</h1>
        <p class="lead">${escapeHtml(landing.copy)}</p>
      </div>
    </section>
    <section class="section insights-explore-intro"><div class="container"><div class="section-header"><p class="eyebrow">${escapeHtml(landing.explore_eyebrow)}</p><h2>${escapeHtml(landing.explore_headline)}</h2><p>${escapeHtml(landing.explore_copy)}</p></div></div></section>
    ${landing.clusters.map((cluster) => renderLandingCluster(cluster, articleMap)).join("")}
  </main>`;

  return pageShell({
    title: landing.meta_title,
    description: landing.meta_description,
    canonical: `${siteUrl}/insights/`,
    image: landing.og_image,
    body,
    bodyClass: "insights-index-page",
    ogTitle: landing.og_title,
    ogDescription: landing.og_description,
    schema: schemaScript(breadcrumbJsonLd([
      { name: "Home", url: `${siteUrl}/` },
      { name: "Insights", url: `${siteUrl}/insights/` },
    ])),
  });
};

const renderArticle = (article, articleMap) => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Insights", href: "/insights/" },
    { name: article.title, href: articlePath(article.slug) },
  ];
  const body = `
  <main class="insight-article-page">
    <article>
      <header class="hero insight-article-hero">
        <div class="container">
          ${renderBreadcrumbs(breadcrumbs)}
           <p class="eyebrow">Dascoda Insights</p>
           ${article.hero_label ? `<p class="insight-hero-label">${escapeHtml(article.hero_label)}</p>` : ""}
           <h1>${escapeHtml(article.title)}</h1>
           <p class="lead">${escapeHtml(article.dek)}</p>
           <div class="article-meta"><span>${escapeHtml(editorialLabel(article))}</span></div>
           ${renderEditorialImage(article.image, "insight-hero-image-frame", "insight-hero-image", { loading: "eager", fetchPriority: "high", sizes: "(max-width: 760px) calc(100vw - 40px), min(1120px, calc(100vw - 80px))" })}
        </div>
      </header>
      <section class="section">
        <div class="container insight-article-layout">
          ${renderOnThisPage(article)}
          <div class="insight-article-body">
            <div class="insight-lede-callout">${escapeHtml(article.lede_callout)}</div>
            ${article.body.map(renderBodyBlock).join("")}
            ${renderSourceList(article)}
          </div>
        </div>
      </section>
    </article>
    ${renderLearningPath(article, articleMap)}
    ${renderRelatedInsights(article, articleMap)}
    ${article.next_cta ? "" : renderArticleCta(article.cta)}
  </main>`;

  return pageShell({
    title: article.meta_title,
    description: article.meta_description,
    canonical: articleCanonical(article),
    image: article.og_image,
    body,
    bodyClass: "insight-detail-page",
    ogTitle: article.og_title,
    ogDescription: article.og_description,
    ogType: "article",
    schema: schemaScript([
      articleJsonLd(article),
      breadcrumbJsonLd([
        { name: "Home", url: `${siteUrl}/` },
        { name: "Insights", url: `${siteUrl}/insights/` },
        { name: article.title, url: articleCanonical(article) },
      ]),
    ]),
  });
};

const loadArticles = async () => {
  const articleDir = path.join(contentDir, "articles");
  const files = (await readdir(articleDir)).filter((file) => file.endsWith(".json")).sort();
  const articles = await Promise.all(files.map((file) => readJson(path.join(articleDir, file))));
  articles.sort((a, b) => a.display_order - b.display_order || a.title.localeCompare(b.title));
  return articles;
};

const validateContent = (landing, articles) => {
  const articleMap = new Map(articles.map((article) => [article.slug, article]));
  const requiredFields = ["title", "slug", "dek", "content_type", "category", "tags", "industries", "solutions", "date_published", "date_updated", "related_slugs", "body", "cta"];

  for (const article of articles) {
    for (const field of requiredFields) {
      if (!(field in article)) throw new Error(`${article.slug} is missing ${field}`);
    }
    for (const slug of article.related_slugs) {
      if (!articleMap.has(slug)) throw new Error(`${article.slug} has unknown related slug ${slug}`);
    }
  }

  for (const cluster of landing.clusters) {
    for (const item of cluster.items) {
      if (!articleMap.has(item.slug)) throw new Error(`Landing cluster ${cluster.id} references unknown slug ${item.slug}`);
    }
  }

  return articleMap;
};

const main = async () => {
  const landing = await readJson(path.join(contentDir, "landing.json"));
  const articles = await loadArticles();
  const articleMap = validateContent(landing, articles);

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "index.html"), cleanHtml(renderLanding(landing, articleMap)), "utf8");

  for (const article of articles) {
    const directory = path.join(outputDir, article.slug);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "index.html"), cleanHtml(renderArticle(article, articleMap)), "utf8");
  }

  console.log(`Generated ${articles.length + 1} Insights pages.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
