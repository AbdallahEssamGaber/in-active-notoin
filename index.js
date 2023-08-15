const express = require("express");
const dotenv = require("dotenv");
var cron = require("node-cron");
const { Client } = require("@notionhq/client");
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const headingBlockId = process.env.NOTION_HEADING_ACTIVE_ID;

let numDoing = 0;
let theChange = [];

app.get("/", (req, res) => {
  cron.schedule("*/3 * * * * *", () => {
    findNewDoingTasks();
  });

  res.status(200).json("Welcome, your app is working well");
});

async function getNumberOfDoingTasks() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Status",
        select: {
          equals: "Doing",
        },
      },
    });
    const results = response.results.length;
    return results;
  } catch (error) {
    console.error(error.body);
  }
}

async function findNewDoingTasks() {
  let num = await getNumberOfDoingTasks();
  const headingState = await getHeadingState();
  num <= 1
    ? (theChange = ["inactive", "red_background"])
    : (theChange = ["active", "green_background"]);

  if (theChange[0] != headingState) {
    console.log("Needs update");
    console.log("has to be " + theChange[0] + " w " + theChange[1]);
  }
  num = numDoing;
}

async function getHeadingState() {
  try {
    const response = await notion.blocks.retrieve({
      block_id: headingBlockId,
    });

    return response.paragraph.rich_text[0].text.content;
  } catch (error) {
    console.error(error.body);
  }
}

app.listen(port, () => {
  console.log(`Running on port ${port}.`);
});

// Export the Express API
module.exports = app;
