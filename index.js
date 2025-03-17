const { google } = require('googleapis');
const fs = require('fs');

// Load OAuth2 credentials from a file
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_id, client_secret, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Authenticate the OAuth2 client
const authenticate = async () => {
    const tokenPath = 'token.json';
    if (fs.existsSync(tokenPath)) {
        const token = fs.readFileSync(tokenPath);
        oAuth2Client.setCredentials(JSON.parse(token));
    } else {
        console.log('Token not found. Authenticate manually first and save the token.');
        process.exit(1);
    }
    return oAuth2Client;
};

// Get the permission ID of the new owner
const getPermissionId = async (auth, fileId, emailAddress) => {
    const drive = google.drive({ version: 'v3', auth });

    try {
        const permissions = await drive.permissions.list({
            fileId,
            fields: 'permissions(id,emailAddress)',
        });

        const permission = permissions.data.permissions.find(p => p.emailAddress === emailAddress);
        if (permission) {
            return permission.id;
        } else {
            // If permission doesn't exist, add the new owner as a writer
            console.log('Adding new owner...');
            const response = await drive.permissions.create({
                fileId,
                requestBody: {
                    role: 'writer',
                    type: 'user',
                    emailAddress,
                },
            });
            return response.data.id;
        }
    } catch (error) {
        console.error('Error retrieving permissions:', error.message);
        throw error;
    }
};

// Transfer ownership of the file
const transferOwnership = async (auth, fileId, permissionId) => {
    const drive = google.drive({ version: 'v3', auth });

    try {
        await drive.permissions.update({
            fileId,
            permissionId,
            requestBody: {
                role: 'owner',
            },
            transferOwnership: true,
        });
        console.log('Ownership successfully transferred.');
    } catch (error) {
        console.error('Error transferring ownership:', error.message);
    }
};

// Main function to execute the transfer
const main = async () => {
    const auth = await authenticate();
    const fileId = '1ZIT0HW0n8ABGDm1wAunzmSdlfub6Mc6l'; // Replace with the actual file ID
    const newOwnerEmail = 'kierendaya091995@gmail.com'; // Replace with the new owner's email

    try {
        const permissionId = await getPermissionId(auth, fileId, newOwnerEmail);
        await transferOwnership(auth, fileId, permissionId);
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
};

main();
