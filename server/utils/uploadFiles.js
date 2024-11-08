require('dotenv').config({ path: '../.env' });

const aws = require('aws-sdk');
const fs = require('fs');
const cron = require('node-cron');

const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;

// AWS SDK configuration
aws.config.update({
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    region: region
});

const s3 = new aws.S3();

// Function to upload log file to S3
const uploadLogFile = async (logFilePath, fileName) => {
    const fileContent = fs.readFileSync(logFilePath);
    const params = {
        Bucket: bucket, // Your S3 bucket name
        Key: `${fileName}`, // file path
        Body: fileContent,
        ContentType: 'text/plain'
    };

    try {
        await s3.upload(params).promise();
        console.log(`${fileName} uploaded to S3`);
    } catch (error) {
        console.error(`Error uploading ${fileName}: `, error);
    }
}

// List log files from the S3 bucket
async function listLogFiles(bucketName) {
    const params = {
        Bucket: bucketName,
        Prefix: 'logs/'  // Assuming your logs are in a 'logs/' folder in S3
    };

    try {
        const response = await s3.listObjectsV2(params).promise();
        // console.log('List of log files:', response.Contents);
        // console.log("params: ", params);
        return response.Contents;  // List of objects in the bucket
    } catch (error) {
        console.error('Error listing log files:', error);
        throw new Error('Failed to list log files');
    }
}

// Function to delete logs older than 2 days
async function deleteOldLogs() {
    try {
        const logs = await listLogFiles(bucket);
        const currentDate = new Date();
        const twoDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 2));
        const logRegex = /"level":"(info|error|warn)","message":"(([^'"]*)"|(HTTP REQUEST) 'ADDR':'([^']*)' 'USER':'([^']*)' 'REQ':'([^']*)' 'STATUS':'([^']*)' 'SIZE':'([^']*)' 'REF':'([^']*)' 'UA':'([^']*)'"),"timestamp":"(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})?"/gm;

        // check if app.log has lines older than 2 days with regex and delete those lines
        const logFilePath = './logs/app.log';
        const logContent = fs.readFileSync(logFilePath, 'utf8');
        const lines = logContent.split('\n');
        const filteredLines = lines.filter(line => {
            let match = logRegex.exec(lines);
            const time = match[12];
            const logDate = new Date(time);
            return logDate >= twoDaysAgo;
        });
        fs.writeFileSync(logFilePath, filteredLines.join('\n'));

        for (const log of logs) {
            const lastModified = new Date(log.LastModified);
            if (lastModified < twoDaysAgo) {
                const params = {
                    Bucket: bucket,
                    Key: log.Key
                };

                try {
                    await s3.deleteObject(params).promise();
                    console.log(`Deleted ${log.Key} as it was older than 2 days`);
                } catch (error) {
                    console.error(`Error deleting ${log.Key}: `, error);
                }
            }
        }
    } catch (error) {
        console.error('Error deleting old logs:', error);
    }
}

// Schedule the upload to run every 5 minutes (you can adjust this)
// cron.schedule('*/30 * * * * *', */5 * * * * = 5min
cron.schedule('*/5 * * * *', () => {
    const logFilePath = './logs/app.log'; // Path to your log file
    const timestamp = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Singapore',
        hour12: false
    }).replace(',', '').replace('/', '-').replace('/', '-');
    const fileName = `logs/app_log_${timestamp}.log`;
    uploadLogFile(logFilePath, fileName);
    console.log("from uploadfiles: upload log file to S3 every 30 seconds");
});

// Schedule the log deletion to run every midnight (00:00)
cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled log deletion at midnight...');
    deleteOldLogs();
});


module.exports = { uploadLogFile, listLogFiles };
