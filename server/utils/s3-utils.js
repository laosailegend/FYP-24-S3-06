const aws = require('aws-sdk');
const s3 = new aws.S3();

// Function to generate a pre-signed URL for the latest log file
async function generatePreSignedUrl(bucketName, fileKey) {
    const params = {
        Bucket: bucketName,
        Key: fileKey,
        Expires: 3600 // URL valid for 1 hour
    };

    try {
        const url = await s3.getSignedUrlPromise('getObject', params);
        // console.log('URL generated:', url);
        return url;
    } catch (error) {
        // Improved error handling
        console.error(`Error generating pre-signed URL for ${fileKey}:`, error);
        throw new Error(`Failed to generate pre-signed URL for ${fileKey}`);
    }
}

module.exports = { generatePreSignedUrl };

