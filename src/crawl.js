#!/usr/bin/env node

const chalk = require("chalk");
const fetch = require("node-fetch");
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { Command } = require("commander");

const imageTools = require("./images");

const seenImages = new Set();
const seenPages = new Set();

/* Extract and save images from dom */
function extractImages(dom, origin, options) {
  const images = dom.window.document.querySelectorAll("img");
  images.forEach((image) => {
    const url = image.src;
    if (!url || seenImages.has(url)) {
      return;
    } else {
      seenImages.add(url);
    }
    imageTools.fetchAndSaveImage(new URL(url, origin), options);
  });
}

/* Find links in dom and crawl each of them */
function crawlLinks(dom, origin, options) {
  const links = dom.window.document.querySelectorAll("a");
  links.forEach((link) => {
    const stringUrl = link.href;
    if (!stringUrl || seenPages.has(stringUrl)) {
      return;
    }

    const url = new URL(stringUrl, origin);
    if (url.origin !== origin) {
      return;
    }

    crawl(url, origin, options);
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
  if (!origin) {
    origin = url.origin;
  }

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

  /* eslint-disable no-console */
  console.info(chalk`{green \u2714} {gray Crawl completed}`);
};
