const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    const params = {
        Bucket: 'emprosterbucket',
        Prefix: 'logs/'  // Assuming your logs are in a 'logs/' folder in S3
    };

    console.log("LAMBDA LISTLOGFILE - listing log params: ", JSON.stringify(params, null, 2));

    try {
        const response = await s3.listObjectsV2(params).promise();
        console.log('List of log files:', response.Contents);
        
        // Return the list of objects in the bucket
        return {
            statusCode: 200,
            body: JSON.stringify(response.Contents)
        };
    } catch (error) {
        console.log('Error listing log files:', error);

        // Return error message in case of failure
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to list log files' })
        };
    }
};
