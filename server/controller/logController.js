const db = require('../dbConfig');
const aws = require('aws-sdk');
const s3 = new aws.S3();
const lambda = new aws.Lambda();
const bucket = process.env.AWS_S3_BUCKET;

// COMMENT OUT IN LAMBDA, MUST USE IN LOCALHOST
// const accessKey = process.env.AWS_ACCESS_KEY_ID;
// const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
// const region = process.env.AWS_REGION;

// AWS SDK configuration SAME AS ABOVE
// aws.config.update({
//     accessKeyId: accessKey,
//     secretAccessKey: secretKey,
//     region: region
// });

// get logs
exports.getLogs = (req, res) => {
    let minSize, maxSize;
    const { level, request, ip, user, status, size, referrer, user_agent, startTime, endTime, search } = req.query;
    let q = "SELECT * FROM logs WHERE 1=1";  // Start with a base query that always returns true
    const filters = [];

    // Add filters based on query parameters
    if (level) {
        q += " AND level = ?";
        filters.push(level);
    }
    if (request) {
        q += " AND request LIKE ?";
        filters.push(`${request}%`);
    }
    if (ip) {
        q += " AND address = ?";
        filters.push(ip);
    }
    if (user) {
        q += " AND user = ?";
        filters.push(user);
    }
    if (status) {
        q += " AND status = ?";
        filters.push(status);
    }
    if (referrer) {
        q += " AND referrer = ?";
        filters.push(referrer);
    }

    if (size) {
        minSize = parseInt(size.split('-')[0]);
        maxSize = parseInt(size.split('-')[1]);

        q += " AND size BETWEEN ? AND ?";
        filters.push(minSize, maxSize);
    }

    if (user_agent) {
        q += " AND user_agent = ?";
        filters.push(user_agent);
    }

    // Handle timestamp filtering
    if (startTime) {
        const startTimestamp = startTime.includes("T") ? startTime.replace("T", " ") : `${startTime} 00:00:00`;
        q += " AND timestamp >= ?";
        filters.push(startTimestamp);
    }

    if (endTime) {
        const endTimestamp = endTime.includes("T") ? endTime.replace("T", " ") : `${endTime} 23:59:59`;
        q += " AND timestamp <= ?";
        filters.push(endTimestamp);
    }

    // Add search term (if present) to check across multiple columns
    if (search) {
        q += " AND (logid LIKE ? OR level LIKE ? OR message LIKE ? OR address LIKE ? OR user LIKE ? OR request LIKE ? OR status LIKE ? OR size LIKE ? OR referrer LIKE ? OR user_agent LIKE ? OR timestamp LIKE ?)";
        filters.push(`%${search}%`, `%${search}%`, `%${search}%`,
            `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`,
            `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    db.query(q, filters, (err, data) => {
        console.log('Generated Query:', q, filters);

        if (err) return res.status(500).json(err);
        return res.json(data);
    });
};

// ALL BELOW ARE LOG FILTERING OPTIONS PURPOSES

// get logs by level
exports.getLogsLevel = (req, res) => {
    const q = "SELECT DISTINCT level FROM logs WHERE level IS NOT NULL";

    db.query(q, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    })
};

// get logs by request - if logs.request contains GET/PUT/POST/DELETE
exports.getLogsRequest = (req, res) => {
    const request = `%${req.params.request}%`;
    const q = "SELECT * FROM logs WHERE request LIKE ? and request IS NOT NULL";

    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// get IP addresses and eliminate duplicates for the logs
exports.getLogsIPs = (req, res) => {
    const q = "SELECT DISTINCT address FROM logs WHERE address IS NOT NULL";
    db.query(q, (err, data
    ) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// select distinct user from the logs
exports.getLogsUsers = (req, res) => {
    const q = "SELECT DISTINCT user FROM logs WHERE user IS NOT NULL";
    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// get logs by status
exports.getLogsStatus = (req, res) => {
    const q = "SELECT DISTINCT status FROM logs WHERE status IS NOT NULL";

    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// select distinct referrer from the logs
exports.getLogsReferrers = (req, res) => {
    const q = "SELECT DISTINCT referrer FROM logs WHERE referrer IS NOT NULL";
    db.query(q, (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
}

// get logs by timestamp but use a date range
exports.getLogsTimestamp = (req, res) => {
    const start = req.query.start;
    const end = req.query.end;

    const q = "SELECT * FROM logs WHERE timestamp BETWEEN ? AND ?";
    db.query(q, [start, end], (err, data) => {
        if (err) return res.json(err);

        return res.json(data);
    })
};

// exports.getLatestLogs = async (req, res) => {
//     console.log("i am getting the latest logs but am i even running thats the question");
//     try {
//         // List all log files in the 'logs/' directory of your bucket
//         const logs = await listLogFiles(bucket);
//         console.log("logs list: ", logs);
//         if (logs.length === 0) {
//             return res.status(404).json({ error: 'No log files found' });
//         }

//         // Find the most recent log file by sorting the logs by LastModified
//         const latestLog = logs.reduce((latest, log) => {
//             return (new Date(log.LastModified) > new Date(latest.LastModified)) ? log : latest;
//         });

//         const fileKey = latestLog.Key;  // Use the key of the most recent log

//         // Generate pre-signed URL for the most recent log file
//         const url = await generatePreSignedUrl(bucket, fileKey);

//         res.json({ downloadUrl: url });
//     } catch (error) {
//         console.log('Error in getLatestLogs:', error); // Improved error logging
//         res.status(500).json({ error: 'Error generating download URL' });
//     }
// };

exports.getLatestLogs = async (req, res) => {
    console.log("i am getting the latest logs but am i even running thats the question");

    try {
        // Prepare parameters to invoke the listLogFiles Lambda function
        const params = {
            FunctionName: 'listLogFiles',
            InvocationType: 'RequestResponse', // Synchronous invocation
            Payload: JSON.stringify({}),
        };

        console.log("LAMBDA PARAMS: ", params);

        // Lambda expects the Payload to be stringified JSON
        params.Payload = JSON.stringify(params.Payload);

        // Invoke the listLogFiles Lambda function
        const response = await lambda.invoke(params).promise();
        console.log("LAMBDA RESPONSE: ", response);

        // Parse and handle the Lambda response
        const lambdaPayload = JSON.parse(response.Payload);

        if (lambdaPayload.statusCode !== 200) {
            console.log('Lambda function error:', lambdaPayload.body);
            return res.status(500).json({ error: 'Failed to retrieve log files from Lambda function' });
        }

        const logs = JSON.parse(lambdaPayload.body);
        console.log("logs list: ", logs);

        // Ensure there are logs
        if (!logs || logs.length === 0) {
            return res.status(404).json({ error: 'No log files found' });
        }

        // Find the most recent log file by LastModified
        const latestLog = logs.reduce((latest, log) => {
            return (new Date(log.LastModified) > new Date(latest.LastModified)) ? log : latest;
        });

        const fileKey = latestLog.Key;

        // Generate the pre-signed URL for the log file
        const url = await s3.getSignedUrlPromise('getObject', {
            Bucket: bucket,
            Key: fileKey,
            Expires: 60 * 5 // URL expiration time (5 minutes)
        });

        // Return the download URL
        res.json({ downloadUrl: url });
    } catch (error) {
        console.log('Error in getLatestLogs:', error);
        res.status(500).json({ error: `Error generating download URL: ${error}, ${error.message}` });
    }
};


