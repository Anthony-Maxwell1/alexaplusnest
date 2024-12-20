const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const port = 5500;

const GOOGLE_CLIENT_ID =
  "CLIENT_ID";
const GOOGLE_CLIENT_SECRET = "CLIENT_SECRET";
const REDIRECT_URI =
  "REDIRECT_URI";

// Create an OAuth2 client
const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// If tokens are already saved, load them
let access_token = "";
let refresh_token = "";
if (fs.existsSync("auth.json")) {
  const authData = JSON.parse(fs.readFileSync("auth.json"));
  access_token = authData.access_token;
  refresh_token = authData.refresh_token;

  // If there's a refresh token, refresh the access token
  if (refresh_token) {
    oauth2Client.setCredentials({ refresh_token });
    oauth2Client
      .getAccessToken()
      .then((response) => {
        access_token = response.token;
        console.log("Access token refreshed:", access_token);
      })
      .catch((err) => console.error("Failed to refresh token:", err));
  }
}

app.use(bodyParser.json());

// Handle user sign-in by generating the authentication URL
app.get("/auth", (req, res) => {
  // Generate the auth URL with the required scopes
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/sdm.service"], // Add the required scopes
    prompt: "consent", // Request consent every time
  });

  // Redirect the user to the Google authentication URL
  res.redirect(authUrl);
});

app.post("/webhook", (req, res) => {
  const data = JSON.parse(
    Buffer.from(req.body.message.data, "base64").toString()
  );
  console.log("Received event from pub/sub");
  console.log(JSON.stringify(data));
  if (
    data.resourceUpdate &&
    data.resourceUpdate.events &&
    data.resourceUpdate.events["sdm.devices.events.DoorbellChime.Chime"]
  ) {
    console.log("Doorbell chime action detected.");
    fetch(
      "ALEXA_WEBHOOK"
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.URLRoutineTrigger.triggerActivationStatus) {
          console.log("Triggered doorbell chime on alexa");
        } else {
          console.log("Failed to trigger doorbell chime on alexa");
        }
      })
      .catch((error) =>
        console.error("Error triggering doorbell chime:", error)
      );
    return res.status(200).send("Doorbell chime action detected.");
  }

  // If the action doesn't match, send a 200 OK response to acknowledge receipt
  return res.status(200).send("Event received but not processed.");
});

// Handle the callback from Google and exchange the authorization code for tokens
app.get("/finishAuth", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Authorization code is missing.");
  }

  try {
    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    access_token = tokens.access_token;
    refresh_token = tokens.refresh_token;

    // Save tokens to a file for future use
    fs.writeFileSync(
      "auth.json",
      JSON.stringify({ access_token, refresh_token }, null, 2)
    );

    console.log("Tokens saved:", tokens);

    // Now that we have the access token, let's fetch devices
    const smartDeviceManagement = google.smartdevicemanagement({
      version: "v1",
      auth: oauth2Client,
    });

    const devicesResponse =
      await smartDeviceManagement.enterprises.devices.list({
        parent: "enterprises/19dfc618-7720-499c-bb29-ada4de33c534", // Update with your actual enterprise ID
      });

    const devices = devicesResponse.data.devices;
    console.log("Devices:", devices);

    // Respond to the user
    res.send("Authentication successful. Devices retrieved. Check console.");
  } catch (error) {
    console.error("Error exchanging authorization code:", error);
    res.status(500).send("Error during authentication.");
  }
});

// Refresh the access token automatically when expired
const refreshAccessToken = async () => {
  try {
    if (refresh_token) {
      oauth2Client.setCredentials({ refresh_token });
      const response = await oauth2Client.getAccessToken();
      access_token = response.token;
      console.log("Access token refreshed:", access_token);
    }
  } catch (error) {
    console.error("Failed to refresh access token:", error);
  }
};

// Set an interval to refresh the token every 59 minutes
setInterval(refreshAccessToken, 3540000); // Refresh token every 59 minutes

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
