# Alexa + Nest
## Google doesn't let me use alexa with the V1 doorbell. So I fixed it.
### Prerequisites
Warning: This is not free. It costs $5 to set up Google Device Access.
- Node.js installed on your device.
- Basic knowledge of a terminal and node.js, if not you can still do it but errors will be hard to debug.
- A google device access acount. Warning: This costs $5, to prevent device hacking attempts.
- A device to run this on. MacOS, windows and any form of linux work. I prefer a raspberry pi.
- An ngrok static url, and knowledge of how to use the CLI.

### Step 1.
Follow [this](https://developers.google.com/nest/device-access/get-started) guide to set up Google cloud and google device access. Set redirect URI to your ngrok static url, with "/finishAuth" on the end. Remember to download the credentials.

### Step 2.
Follow [this](https://developers.google.com/nest/device-access/subscribe-to-events) guide up until Generate Events, to set up pub/sub.

### Step 3.
Go to the pub/sub page through the link in the previous guide. Click on your new subscription, and set it to "Push" instead of "Pull", then enter your ngrok static url with "/webhook" on the end.

### Step 3.
Set up your webhook (here)[https://www.virtualsmarthome.xyz/url_routine_trigger/] and link it to your alexa. Name it anything, this will be your doorbell. In alexa, make sure to enable doorbell ring notefications in the device that is discovered.

### Step 4.
**This step is to be done on your device.**
Download index.js, and run `npm install express googleapis google-auth-library`.
Replace CLIENT_ID, CLIENT_SECRET with the ones contained in the credentials file you downloaded. Replace REDIRECT_URI with what you entered in redirect URI in step 1.
```javascript
const GOOGLE_CLIENT_ID = "CLIENT_ID";
const GOOGLE_CLIENT_SECRET = "CLIENT_SECRET";
const REDIRECT_URI = "REDIRECT_URI";
```
paste the url for webhook json in the fetch in "/webhook". Don't forget the string.
```javascript
fetch(
  "https://www.virtualsmarthome.xyz/url_routine_trigger/activate.php?trigger=c92d7dc8-00c9-428a-9758-b5c64fae6d6f&token=432b669a-fdd0-4b12-8f26-bfd05e708210&response=json"
)
```

### Step 5.
Run `node index.js`.
In another tab/terminal, run `ngrok http --url=YOUR_STATIC_URL 5500`

### That's it!
