#!/usr/bin/env node

const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { Command } = require("commander");

const imageTools = require("./images");

const seenImages = new Set();
const seenPages = new Set();

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

function crawlLinks(dom, origin) {
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

    crawl(url, origin);
  });
}

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

  const resp = await fetch(url);
  const html = await resp.text();

  const domOptions = {};
  if (options.executeJs) domOptions.runScripts = "dangerously";
  const dom = new JSDOM(html, domOptions);
  extractImages(dom, origin, options);
  crawlLinks(dom, origin, options);
}

const program = new Command();
program
  .version("0.0.1")
  .name("crawl")
  .arguments("<url>")
  .description("crawl a site and download all encountered images", {
    url: "initial url where to start crawl",
  })
  .option("-o, --output-dir", "set output directory", "./images")
  .option("-x, --execute-js", "dangerously execture Javascript")
  .action((url, options) => crawl(url, null, options))
  .parse(process.argv);
