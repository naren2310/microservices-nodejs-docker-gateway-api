const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const {
  set_current_user,
  setApp_Version,
  validate_id_attribute,
  user_token_validation,
  get_db_connection,
} = require("./guard");
const parameters = require("./config").getParameters();

const app = express();
app.use(express.json());
app.use(bodyParser.json());

const port = parameters.PORT || 3000;

const token_required = async (req, res) => {
  var token;
  let response;
  if ("x-access-token" in req.headers) {
    token = req.headers["x-access-token"];
  }
  if (!token) {
    if (req.headers["User-Agent"].toString().count("UptimeChecks") != 0) {
      console.log("Uptime check trigger.");
      response = {
        status: "API-ACTIVE",
        status_code: "200",
        message: "Uptime check trigger.",
      };
      return response;
    } else {
      console.log("Invalid Token.");
      response = {
        status: "FAILURE",
        status_code: "401",
        message: "Invalid Token.",
      };
      return response;
    }
  }

  try {
    const formattedToken = token.trim();
    const token_format = new RegExp(parameters.TOKEN_FORMAT);
    let cursor;
    if (!token_format.test(formattedToken)) {
      console.log("Invalid Token format.");
      response = {
        status: "FAILURE",
        status_code: "401",
        message: "Invalid Token format.",
      };
      return response;
    } else {
      const data = jwt.decode(formattedToken, parameters.JWT_SECRET_KEY, {
        algorithms: ["HS256"],
      });
      var conn = await get_db_connection();
      const query = `SELECT auth_token FROM public.user_master WHERE mobile_number = ${data.mobile_number}`;
      cursor = await conn.query(query);
      const result = cursor.rows;
      for (const row of result) {
        const DBToken = row["auth_token"]["token_key"];
        if (DBToken === formattedToken) {
          console.log("Tokens are equal");
          // decoding the payload to fetch the stored details
          return { status: true, data };
        } else {
          console.log("Tokens are not equal");
          response = {
            status: "FAILURE",
            status_code: "401",
            message: "Invalid Token.",
          };
          return response;
        }
      }
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.log("Token Expired:", error.message);
      response = {
        status: "FAILURE",
        status_code: "401",
        message: "Token Expired.",
      };
      return response;
    } else {
      console.log("Invalid Token.");
      response = {
        status: "FAILURE",
        status_code: "401",
        message: "Invalid Token.",
      };
      return response;
    }
  }
};

app.post("/api/mobile_api_get_block_list", async (req, res) => {
  var token_data = await token_required(req);
  if (token_data.status == "FAILURE") {
    return res.status(401).json({
      status: token_data.status,
      status_code: token_data.status_code,
      message: token_data.message,
      data: {},
    });
  }
  var token_status = token_data.status;
  var token_datas = token_data.data;
  if (!token_status) {
    return token_datas;
  }

  try {
    console.log("********Get Block List*********");
    const block_list = [];
    if (req.body) {
      const { DISTRICT_ID, USER_ID, APP_VERSION } = req.body;
      set_current_user(USER_ID);

      if (APP_VERSION) {
        setApp_Version(APP_VERSION);
      }

      const is_valid_id = validate_id_attribute(USER_ID, DISTRICT_ID);
      if (!is_valid_id) {
        return res.status(401).json({
          status: "FAILURE",
          status_code: "401",
          message: "Supplied IDs are not Valid.",
          data: {},
        });
      } else {
        const is_token_valid = await user_token_validation(
          USER_ID,
          token_datas.mobile_number
        );
        if (!is_token_valid) {
          return res.status(401).json({
            status: "FAILURE",
            status_code: "401",
            message: "Unregistered User/Token-User mismatch",
            data: {},
          });
        } else {
          console.log("Token Validated.");
          const client = await get_db_connection();
          const query =
            "SELECT DISTINCT block_name, block_id FROM public.address_block_master WHERE district_id = $1";
          const values = [DISTRICT_ID];
          const result = await client.query(query, values);
          const rowss = result.rows;
          for (const row of rowss) {
            const block = {
              block_name: row.block_name,
              block_id: row.block_id,
            };
            block_list.push(block);
          }

          if (block_list.length === 0) {
            console.log("There is no Blocks available.");
            return res.status(200).json({
              status: "SUCCESS",
              status_code: "200",
              message:
                "There are no Blocks available, Please contact administrator.",
              data: {},
            });
          } else {
            console.log("Success retrieving Block data.");
            return res.status(200).json({
              status: "SUCCESS",
              status_code: "200",
              message: "Success retrieving Block data.",
              data: { block_list },
            });
          }
        }
      }
    } else {
      console.log("The req format should be in JSON.");
      return res.status(401).json({
        status: "FAILURE",
        status_code: "401",
        message: "Error!! The req format should be in JSON.",
        data: {},
      });
    }
  } catch (error) {
    console.log("get_block_list", error);
    return res.status(401).json({
      status: "FAILURE",
      status_code: "401",
      message: "Error while retrieving Block data, Please Retry.",
      data: {},
    });
  }
});

app.get("/api/mobile_api_get_block_list/hc", (req, res) => {
  return res.status(200).json({
    status: "SUCCESS",
    status_code: "200",
    message: "success mobile_api_get_block_list health check",
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
