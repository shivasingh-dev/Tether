# GMAIL API OAUTH2 SETUP GUIDE (TETHER CHAT)

This guide contains step-by-step instructions to set up the Gmail REST API with **OAuth2** for a new email address. Follow these steps to generate a permanent refresh token for production on Railway.

---

## STEP 1: Enable Gmail API in Google Cloud Console
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (or create a new project called `TetherChat`).
3. Search for **"Gmail API"** in the top search bar and select it.
4. Click the **ENABLE** button.

---

## STEP 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen** from the left sidebar.
2. Select **External** and click **CREATE**.
3. Fill in the required details:
   - **App name**: `Tether`
   - **User support email**: Select your **NEW email** address.
   - **Developer contact information**: Enter your **NEW email** address.
4. Click **SAVE AND CONTINUE**.
5. **Scopes Step**: Click **SAVE AND CONTINUE** (no need to change anything here).
6. **Test Users Step**: Click **ADD USERS**, type your **NEW email** address, click **ADD**, and then click **SAVE AND CONTINUE**.
7. Go back to the OAuth Consent Screen dashboard.
8. **CRITICAL STEP FOR PERMANENT TOKEN**: Under "Publishing status", click the **PUBLISH APP** button and confirm. 
   *Note: This moves your app to "In Production" status so your tokens will NEVER expire after 7 days!*

---

## STEP 3: Create OAuth 2.0 Credentials (Client ID & Client Secret)
1. Go to **APIs & Services** > **Credentials** from the left sidebar.
2. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
3. Choose **Web application** as the Application type.
4. Name it anything (e.g. `Tether Web App`).
5. Scroll down to **Authorized redirect URIs** and click **ADD URI**.
6. Paste this exact URI:
   `https://developers.google.com/oauthplayground`
7. Click **CREATE**.
8. A popup will show your **Client ID** and **Client Secret**. Copy them immediately!

---

## STEP 4: Update `.env` (Part 1)
Open your backend `.env` file and update the following values with your new credentials:
```env
OAUTH_EMAIL=your_new_email@gmail.com
OAUTH_CLIENT_ID=your_new_client_id_here
OAUTH_CLIENT_SECRET=your_new_client_secret_here
```

---

## STEP 5: Generate the Refresh Token using Google OAuth Playground
1. Go to the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the **OAuth 2.0 Configuration (Gear Icon)** in the top right corner.
3. Check the **Use own OAuth credentials** box.
4. Paste your **OAuth Client ID** and **OAuth Client Secret** that you created in Step 3.
5. On the left panel under **Step 1: Select & authorize APIs**:
   - In the input field "Input your own scopes", type:
     `https://mail.google.com/`
   - Click the blue **Authorize APIs** button.
6. A Google login popup will open. Select your **NEW email** address.
7. Google might show a security warning ("Google hasn't verified this app").
   - Click **Advanced** at the bottom.
   - Click **Go to Tether (unsafe)**.
8. Click **Continue** to grant the permissions.
9. You will be redirected back to the Playground.
10. In **Step 2: Exchange authorization code for tokens**, click the blue **Exchange authorization code for tokens** button.
11. The Playground will populate the fields on the right.
12. Copy the **Refresh Token** value (starts with `1//`).

---

## STEP 6: Update `.env` (Part 2)
Paste the generated refresh token into your `.env` file:
```env
OAUTH_REFRESH_TOKEN=your_new_refresh_token_here
```

---

## STEP 7: Restart your Server
- Restart your local backend server: `npm run dev`
- Redeploy your backend on Railway with the updated environment variables.

You are all set! The Gmail API is now configured with your new email and will work permanently on Railway!
