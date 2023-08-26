const express = require("express");
const dotenv = require("dotenv");
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
  setInitialNumberOfTasks().then(() => {
    setInterval(findNewDoingTasks, 3000);
  });
  res.send("Express on Render");
});

async function setInitialNumberOfTasks() {
  numDoing = await getNumberOfDoingTasks();
}

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

    //Filter only the ones in the top and Really. Doing.
    const results = response.results.filter(
      (item) => item.properties["Sub-item"].relation.length == 0
    );
    return results.length;
  } catch (error) {
    console.error(error.body);
  }
}

async function findNewDoingTasks() {
  let num = await getNumberOfDoingTasks();
  const headingState = await getHeadingState();
  num < 1
    ? (theChange = ["inactive", "red_background"])
    : (theChange = ["active", "green_background"]);

  if (theChange[0] != headingState) {
    const res = await updateHeading(theChange);
    console.log(res);
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

async function updateHeading(prop) {
  try {
    const response = await notion.blocks.update({
      block_id: headingBlockId,
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: { content: prop[0] },
            annotations: {
              italic: true,
            },
            plain_text: "active",
          },
        ],
        color: prop[1],
      },
    });
    return response;
  } catch (error) {
    console.error(error.body);
  }
}

app.listen(port, () => {
  console.log(`Running on port ${port}.`);
});
