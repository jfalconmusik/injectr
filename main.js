Parse.initialize(
  "i1n5ocgqfKFxUW1pHIGl69o5Zi2rCXDPMOUzoLpI", // This is your Application ID
  "HpIjRypO3TtIxFJtnubmEzmvfgBSthdA1vuHth9M", // This is your Javascript key
  "eNhhRrWFCu6eASCvTHSReuSDdnvY7S09TH6s6KHD" // This is your Master key (never use it in the frontend)
);

const headers = {
  Accept: "application/json",
  "Content-type": "application/json",
  "X-Parse-Application-Id": "i1n5ocgqfKFxUW1pHIGl69o5Zi2rCXDPMOUzoLpI",
  "X-Parse-REST-API-Key": "DfXaMCziIoG6Xsq9Mjy4Ofx6FdV35ZoH8fBhCjyW",
};

// You're gonna have to write some actual  new functions, lol.

function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  s = (s - mins) / 60;
  var hrs = s % 24;
  s = (s - hrs) / 24;
  var days = s % 30;
  s = (s - days) / 30;

  let dayString = "";
  if (days > 0) {
    dayString = `${days} days, `;
  }
  let hrsString = "";
  if (hrs > 0) {
    hrsString = `${hrs} hrs, `;
  }
  let minString = "";
  if (mins > 0) {
    minString = `${mins} min, `;
  }

  return `${dayString}${hrsString}${minString}${secs} sec`;
}
// Create user:
Parse.Cloud.define("createUser", (request) => {
  let result;
  console.log(
    `Request: ${JSON.stringify(request)}; Params: ${JSON.stringify(
      request.params
    )}`
  );
  const email = request.params.email;
  const username = request.params.username;
  const password = request.params.password;

  const user = new Parse.User();
  user.set("username", username);
  user.set("email", email);
  user.set("password", password);

  return user
    .signUp()
    .then((user) => {
      if (typeof document !== "undefined")
        document.write(`User signed up: ${JSON.stringify(user)}`);
      console.log("User signed up", user);
      return user;
    })
    .catch((error) => {
      if (typeof document !== "undefined")
        document.write(`Error while signing up user: ${JSON.stringify(error)}`);
      console.error("Error while signing up user", error);
      return error;
    });
});

// Login:
Parse.Cloud.define("login", (request) => {
  let r = request.params;
  let username = r.username;
  let password = r.password;

  return Parse.User.logIn(username, password)
    .then((user) => {
      // Do stuff after successful login
      if (typeof document !== "undefined")
        document.write(`Logged in user: ${JSON.stringify(user)}`);
      console.log("Logged in user", user);
      return user;
    })
    .catch((error) => {
      if (typeof document !== "undefined")
        document.write(`Error while logging in user: ${JSON.stringify(error)}`);
      console.error("Error while logging in user", error);
      return error;
    });
});

// Return all cracks that have the user's id.
Parse.Cloud.define("userEntries", (request) => {
  const userID = request.params.uid;
  const anonInt = request.params.anonInt;
  console.log(`user entries requested. userID: ${userID}, anonInt: ${anonInt}`);

  const MyCustomClass = Parse.Object.extend("puppet");
  const query = new Parse.Query(MyCustomClass);
  if (userID) {
    query.equalTo("userID", userID);
    return query.find().then(
      (results) => {
        // You can use the "get" method to get the value of an attribute
        // Ex: response.get("<ATTRIBUTE_NAME>")
        if (typeof document !== "undefined")
          document.write(`ParseObjects found: ${JSON.stringify(results)}`);
        console.log("ParseObjects found:", results);

        return results;
      },
      (error) => {
        if (typeof document !== "undefined")
          document.write(
            `Error while fetching ParseObjects: ${JSON.stringify(error)}`
          );
        console.error("Error while fetching ParseObjects", error);
        return error;
      }
    );
  } else {
    query.equalTo("anonInt", anonInt);
    return query.find().then(
      (results) => {
        // You can use the "get" method to get the value of an attribute
        // Ex: response.get("<ATTRIBUTE_NAME>")
        if (typeof document !== "undefined")
          document.write(`ParseObjects found: ${JSON.stringify(results)}`);
        console.log("ParseObjects found:", results);

        return results;
      },
      (error) => {
        if (typeof document !== "undefined")
          document.write(
            `Error while fetching ParseObjects: ${JSON.stringify(error)}`
          );
        console.error("Error while fetching ParseObjects", error);
        return error;
      }
    );
  }
});

Parse.Cloud.define("spawnPuppet", (request) => {
  const r = request.params;
  const url = r.url;
  const userID = r.userID;
  const anonInt = r.anonInt;
  const instructions = r.instructions;

  //   replace with a real url.
  Parse.Cloud.httpRequest({
    url: `https://injectr-d2206.uc.r.appspot.com/`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    mode: "cors",
    body: JSON.stringify({
      url,
      instructions,
      userID,
      anonInt,
    }),
  })
    .then((response) => {
      console.log("injectr response, spawn puppet:", response);
      return JSON.parse(JSON.stringify(response));
    })
    .then((json) => {
      console.log("injectr response, spawn puppet json:", json);
      return json;
    });
});

Parse.Cloud.define("save", async (request) => {
  console.log("save request started");
  //   new Parse.File("resume.txt", { base64: btoa("My file content") });

  const r = request.params;
  const instructions = r.instructions;
  const puppet = r.puppet;
  const userID = r.userID;
  const url = r.url;

  // const imgData = puppet.png;
  // if (puppet.png) {
  //   console.log("imgData", imgData);
  //   const newImg = new Parse.File(
  //     `screenshot${(Math.random() * 100).toFixed(0)}.png`,
  //     { base64: imgData }
  //   );
  // }
  const MyCustomClass = Parse.Object.extend("puppet");

  // return newImg.save().then(function () {
  // console.log(newImg.url);

  const anonInt = r.anonInt;

  const myNewObject = new MyCustomClass();

  myNewObject.set("html", puppet.html);
  myNewObject.set("url", url);
  myNewObject.set("instructions", instructions);
  // myNewObject.set("Image", newImg);
  // myNewObject.set("imgUrl", newImg.url);
  if (userID) {
    myNewObject.set("userID", userID);
  } else {
    myNewObject.set("anonInt", anonInt);
  }

  let finalRes = myNewObject.save().then(
    (result) => {
      if (typeof document !== "undefined")
        document.write(`ParseObject created: ${JSON.stringify(result)}`);
      console.log("ParseObject created", result);
      itemID = result.id;
      console.log(`item id: ${itemID}`);
      // console.log(`hash: ${hash}`);

      if (itemID) {
        return { result, itemID };
      }
    },
    (error) => {
      if (typeof document !== "undefined")
        document.write(
          `Error while creating ParseObject: ${JSON.stringify(error)}`
        );
      console.error("Error while creating ParseObject: ", error);
      return error;
    }
  );

  return finalRes;
  // });
});
