const { BlobServiceClient } = require('@azure/storage-blob');
const parseMultipart = require('parse-multipart-data');

module.exports = async function (context, req) {
    try {
        // Parse multipart form data
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('multipart/form-data')) {
            context.res = {
                status: 400,
                body: { error: 'Content-Type must be multipart/form-data' }
            };
            return;
        }

        const boundary = parseMultipart.getBoundary(contentType);
        const parts = parseMultipart.parse(req.body, boundary);

        if (!parts || parts.length === 0) {
            context.res = {
                status: 400,
                body: { error: 'No file uploaded' }
            };
            return;
        }

        const file = parts[0];
        const fileName = file.filename;
        const fileData = file.data;

        // Upload to Blob Storage
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.STORAGE_CONNECTION_STRING
        );

        const containerClient = blobServiceClient.getContainerClient('images');
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        await blockBlobClient.uploadData(fileData, {
            blobHTTPHeaders: {
                blobContentType: file.type
            }
        });

        const fileUrl = blockBlobClient.url;

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                fileName: fileName,
                url: fileUrl
            }
        };
    } catch (error) {
        context.log.error('Error uploading file:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to upload file' }
        };
    }
};
