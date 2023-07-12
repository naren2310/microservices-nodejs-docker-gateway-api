const pg = require("pg");

const config = require("./config");

const parameters = config.getParameters();

let current_appversion = "Prior V_3.1.4";
let current_userId = "NA";

const setApp_Version = (app_version) => {
  current_appversion = app_version;
  return current_appversion;
};

const set_current_user = (userId) => {
  var current_userId;
  current_userId = userId;
};

const validate_id_attribute = (userId, districtId) => {
  var is_valid_id = false;
  try {
    if (userId == "" && districtId == "") {
      console.log("Both userId and districtId are empty");
      return is_valid_id;
    } else {
      return validate_id(userId, districtId);
    }
  } catch (error) {
    print(
      "Error validating Id attribute :  %s | %s | %s",
      str(error),
      current_userId,
      current_appversion
    );
    return is_valid_id;
  }
};

function validate_id(...ids) {
  try {
    const validIds = [];
    for (const id of ids) {
      if (id !== null && typeof id === "string" && id !== "" && id !== " ") {
        // id is composed of alphanumeric and hyphen characters
        // id pattern is compiled with alphanumeric and hyphen character in regex.
        const idPattern = new RegExp(parameters.ID_PATTERN);

        // id format is compiled below using regex.
        // sample id = "54cd29b1-ffad-46bb-8390-25a435b6a264"
        const idFormat = new RegExp(parameters.ID_FORMAT);

        // Checks whether the whole string matches the re.pattern or not
        if (
          idPattern.test(id) &&
          idFormat.test(id) &&
          id.length === parameters.ID_LENGTH
        ) {
          validIds.push(true);
        } else {
          console.log(`ID is not valid ${id}`);
          validIds.push(false);
        }
      }
    }
    if (validIds.every((item) => item) && validIds.length !== 0) {
      return true;
    } else {
      console.log("One or more supplied ID not valid.");
      return false;
    }
  } catch (error) {
    console.log(
      `Error validating Id attribute format: ${error} | ${current_userId} | ${current_appversion}`
    );
    return false;
  }
}

async function user_token_validation(userId, mobile) {
  let spnDBUserId = 0;
  try {
    const client = await get_db_connection();
    const query =
      "SELECT user_id FROM public.user_master WHERE mobile_number = $1 AND user_id = $2";
    const values = [mobile, userId];
    const result = await client.query(query, values);
    const rowss = result.rows;
    for (let row of rowss) {
      spnDBUserId = row.user_id; // user ID fetched from spannerDB using the mobile number
    }
    if (spnDBUserId !== 0) {
      // Condition to validate userId exists in spannerDB
      if (spnDBUserId === userId) {
        return true;
      } else {
        console.log("Token is not valid for this user.");
        return false;
      }
    } else {
      console.log("Unregistered User/Token-User mismatch.");
      return false;
    }
  } catch (error) {
    console.log("Error in user_token_validation:", error);
    return false;
  }
}

const get_db_connection = () => {
  const conn = new pg.Pool({
    host: "142.132.206.93",
    database: "postgres",
    user: "tnphruser",
    password: "TNphr@3Z4",
  });
  return conn;
};

module.exports = {
  get_db_connection,
  user_token_validation,
  validate_id,
  validate_id_attribute,
  set_current_user,
  setApp_Version,
};
