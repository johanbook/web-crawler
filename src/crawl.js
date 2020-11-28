const chalk = require("chalk");
const fetch = require("node-fetch");
const fs = require("fs");
const { JSDOM } = require("jsdom");

const utils = require("./utils");

const seenImages = new Set();
const seenPages = new Set();

/* Extract and save images from dom */
function extractImages(dom, origin, options) {
  dom.window.document.querySelectorAll("img").forEach(({ src }) => {
    if (src && !seenImages.has(src)) {
      seenImages.add(url);
      utils.fetchAndSaveImage(new URL(src, origin), options);
    }
  });
}

function shouldCrawlUrl(url, referrer, mode) {
  if (!url) return false;
  if (mode === "all") return true;
  if (mode === "origin") return url.origin === referrer.origin;
  if (mode === "pathname")
    return url.origin === referrer.origin && url.pathname === referrer.pathname;
}

/* Find links in dom and crawl each of them */
function crawlLinks(dom, origin, options) {
  dom.window.document.querySelectorAll("a").forEach(({ href }) => {
    const url = new URL(href, origin);
    if (shouldCrawlUrl(url, origin, options.mode)) {
      crawl(url, origin, options);
    }
  });
}

/* Crawl url */
async function crawl(stringUrl, origin, options) {
  if (seenPages.has(stringUrl)) {
    return;
  } else {
    seenPages.add(stringUrl);
  }

  const url = new URL(stringUrl);
  origin = origin || url;

  /* eslint-disable no-console */
  console.info(
    chalk`{blue \u1433} {gray Crawling} {green ${url.host + url.pathname}}`
  );

  const resp = await fetch(url);
  const html = await resp.text();

  const domOptions = {};
  if (options.executeJs) domOptions.runScripts = "dangerously";
  const dom = new JSDOM(html, domOptions);
  crawlLinks(dom, origin, options);
  extractImages(dom, origin, options);
}

/** Verify options and then begin crawl */
module.exports = function setup(url, options) {
  if (!fs.existsSync(options.outputDir)) {
    /* eslint-disable no-console */
    console.error(
      chalk.red.bold("Error:"),
      chalk.reset(`Output folder '${options.outputDir}' does not exist`)
    );
    process.exit(1);
  }
  if (!url.includes("https")) {
    url = "https://" + url;
  }

  crawl(url, undefined, options);
};
