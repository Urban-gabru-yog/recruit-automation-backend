require("dotenv").config();
const fetch = require("isomorphic-fetch");
global.fetch = fetch;

const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");

const credential = new ClientSecretCredential(
  process.env.MS_TENANT_ID,
  process.env.MS_CLIENT_ID,
  process.env.MS_CLIENT_SECRET
);

const graphClient = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const tokenResponse = await credential.getToken(
        "https://graph.microsoft.com/.default"
      );
      return tokenResponse.token;
    },
  },
});

const uploadToOneDrive = async (buffer, filename) => {
  try {
    const folderPath = process.env.MS_FOLDER_PATH || "/Documents/Resumes";
    // const uploadPath = `${folderPath}/${filename}`;
    const uploadPath = `${process.env.MS_FOLDER_PATH}/${filename}`;

    graphClient
      .api(
        `/users/${process.env.MS_DRIVE_USER}/drive/root:${uploadPath}:/content`
      )
      .put(buffer);

    const result = await graphClient
      .api(
        `/users/${process.env.MS_DRIVE_USER}/drive/root:${uploadPath}:/content`
      )
      .put(buffer);

    const share = await graphClient
      .api(
        `/users/${process.env.MS_DRIVE_USER}/drive/items/${result.id}/createLink`
      )
      .post({ type: "view", scope: "anonymous" });

    return share.link.webUrl;
  } catch (error) {
    console.error("OneDrive upload failed:", error);
    return null;
  }
};

const appendToExcel = async (jobId, row) => {
  console.log(`Append row to Excel for job ${jobId}:`, row);
  // Integrate Microsoft Graph Excel APIs here if needed.
};

module.exports = { uploadToOneDrive, appendToExcel };
