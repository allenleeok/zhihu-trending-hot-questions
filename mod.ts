#!/usr/bin/env -S deno run --unstable --allow-net --allow-read --allow-write --import-map=import_map.json
// Copyright 2020 justjavac(迷渡). All rights reserved. MIT license.
import { format } from "std/datetime/mod.ts";
import { join } from "std/path/mod.ts";
import { exists } from "std/fs/mod.ts";

import type { HotList, Question } from "./types.ts";
import { createArchive, createReadme, mergeQuestions } from "./utils.ts";

const response = await fetch(
  "https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=100",
);

if (!response.ok) {
  console.error(response.statusText);
  Deno.exit(-1);
}

const result: HotList = await response.json();

const questions: Question[] = result.data.map((x) => ({
  title: x.target.title,
  url: `https://www.zhihu.com/question/${x.card_id.split("_")[1]}`,
}));

const yyyyMMdd = format(new Date(), "yyyy-MM-dd");
const fullPath = join("raw", `${yyyyMMdd}.json`);

let questionsAlreadyDownload: Question[] = [];
if (await exists(fullPath)) {
  const content = await Deno.readTextFile(fullPath);
  questionsAlreadyDownload = JSON.parse(content);
}

// 保存原始数据
const questionsAll = mergeQuestions(questions, questionsAlreadyDownload);
await Deno.writeTextFile(fullPath, JSON.stringify(questionsAll));

// 更新 README.md
const readme = await createReadme(questionsAll);
await Deno.writeTextFile("./README.md", readme);

// 更新 archives
const archiveText = createArchive(questionsAll, yyyyMMdd);
const archivePath = join("archives", `${yyyyMMdd}.md`);
await Deno.writeTextFile(archivePath, archiveText);
