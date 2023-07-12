const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = 9020;

const { mobile_api_get_block_list } = require("./URLs");

const optionsGetBlockList = {
  target: mobile_api_get_block_list,
  changeOrigin: true,
};

const blockListProxy = createProxyMiddleware(optionsGetBlockList);

app.get("/", (req, res) => res.send("Hello Gateway API"));
app.get("/api/mobile_api_get_block_list", blockListProxy);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
