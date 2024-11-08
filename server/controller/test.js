require('dotenv').config({ path: '../.env' });
const AWS = require('aws-sdk');
const fs = require('fs');
const { generatePreSignedUrl } = require('../utils/s3-utils');  // Adjust the path to your file
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;

// Configure AWS SDK
AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET || 'emprosterbucket';
console.log(bucketName);
console.log(accessKeyId);
console.log(secretAccessKey);
console.log(region);

// File you want to upload
const filePath = '../logs/file.txt'; // Update with your file path
const fileName = 'logs/fileS3.txt'; // Choose a file name for S3

const uploadFile = async () => {
    const fileContent = fs.readFileSync(filePath);

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent,
        ContentType: 'text/plain'
    };

    try {
        const uploadResponse = await s3.upload(params).promise();
        console.log('File uploaded successfully:', uploadResponse);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
};

const fileKey = 'logs/fileS3.txt';  // The file you uploaded

// Test the function
generatePreSignedUrl(bucketName, fileKey)
    .then(url => {
        console.log('Pre-signed URL:', url);
    })
    .catch(error => {
        console.error('Error:', error);
    });

// uploadFile();

// Test function to delete a specific file from S3
async function deleteTestFile() {
    const testFileName = 'logs/fileS3.txt';  // The file you want to delete

    const params = {
        Bucket: bucketName, // Your S3 bucket name
        Key: testFileName // The key of the file you want to delete
    };

    try {
        await s3.deleteObject(params).promise();
        console.log(`Successfully deleted ${testFileName} from S3.`);
    } catch (error) {
        console.error(`Error deleting ${testFileName}: `, error);
    }
}

// Run the test function
deleteTestFile();
