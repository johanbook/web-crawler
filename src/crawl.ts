import chalk from "chalk";
import fetch from "node-fetch";
import * as fs from "fs";
import { JSDOM, ConstructorOptions } from "jsdom";

import * as utils from "./utils";
import CrawlOptions from "./CrawlOptions";

const seenImages = new Set();
const seenPages = new Set();

/* Extract and save images from dom */
function extractImages(dom: JSDOM, origin: URL, options: CrawlOptions) {
  dom.window.document.querySelectorAll("img").forEach(({ src }) => {
    if (src && !seenImages.has(src)) {
      seenImages.add(src);
      utils.fetchAndSaveImage(new URL(src, origin), options);
    }
  });
}

function shouldCrawlUrl(url: URL, referrer: URL, mode: string): boolean {
  if (!url) return false;
  if (mode === "all") return true;
  if (mode === "origin") return url.origin === referrer.origin;
  if (mode === "pathname")
    return url.origin === referrer.origin && url.pathname === referrer.pathname;
}

/* Find links in dom and crawl each of them */
function crawlLinks(dom: JSDOM, origin: URL, options: CrawlOptions) {
  dom.window.document.querySelectorAll("a").forEach(({ href }) => {
    const url = new URL(href, origin);
    if (shouldCrawlUrl(url, origin, options.mode)) {
      crawl(url, origin, options);
    }
  });
}

/* Crawl url */
async function crawl(url: URL, origin: URL, options: CrawlOptions) {
  if (seenPages.has(url.href)) {
    return;
  }
  seenPages.add(url.href);

  /* eslint-disable no-console */
  console.info(
    chalk`{blue \u1433} {gray Crawling} {green ${url.host + url.pathname}}`
  );

  const resp = await fetch(url);
  const html = await resp.text();

  const domOptions: ConstructorOptions = {};
  if (options.executeJs) {
    domOptions.resources = "usable";
    domOptions.runScripts = "dangerously";
  }
  const dom = new JSDOM(html, domOptions);
  crawlLinks(dom, origin, options);
  extractImages(dom, origin, options);
}

/** Verify options and then begin crawl */
export default function setup(url: string, options: CrawlOptions): void {
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

  const originUrl = new URL(url);
  crawl(originUrl, originUrl, options);
}
