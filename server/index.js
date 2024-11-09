require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');
const jwt = require('jsonwebtoken');
const aws = require('aws-sdk');
const fs = require('fs');
const cron = require('node-cron');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();

// parse every request as json and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// enable cors
// CORS options to allow only specific origin (your frontend URL)
const corsOptions = {
    origin: 'https://emproster.vercel.app', // Allow only requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    credentials: true, // Allow credentials (cookies, authentication headers)
};

app.use(cors(corsOptions)); // Apply CORS middleware globally

// AWS SDK configuration
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;

aws.config.update({
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    region: region
});

const s3 = new aws.S3();


// import controllers
const logController = require('./controller/logController');
const adminController = require('./controller/adminController');
const companyController = require('./controller/companyController');
const employeeController = require('./controller/employeeController');
const HRController = require('./controller/HRController');
const managerController = require('./controller/managerController');

// morgan to log http requests - combined for most detailed
// Custom token to extract the user's email from the JWT
morgan.token('user-email', (req) => {
    // console.log("headers: ", JSON.stringify(req.headers, null, 2)); // 2 is for pretty-printing with indentation

    const token = req.headers['authorization']?.split(' ')[1]; // Adjust based on your token storage
    // console.log("TOKEN: " + token);
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key
            // console.log("decoded: " + JSON.stringify(decoded, null, 2));
            return decoded.email || 'unknown'; // Adjust based on your token payload
        } catch (error) {
            console.log("error decoding: ", error);
            return 'invalid-token';
        }
    }
    return 'no-token';
});

const morganFormat = `HTTP REQUEST 'ADDR':':remote-addr' 'USER':':user-email' 'REQ':':method :url HTTP/:http-version' 'STATUS':':status' 'SIZE':':res[content-length]' 'REF':':referrer' 'UA':':user-agent'`;

app.use(
    morgan(morganFormat, {
        stream: {
            write: (message) => {
                logger.info(message.trim()); // Log the combined format message as-is
            },
        },
    })
);

// middleware for logging IP address
app.use(adminController.logIP);

// define routes for logController
app.get("/logs", logController.getLogs);
app.get("/logsLevel", logController.getLogsLevel);
app.get("/logsIP", logController.getLogsIPs);
app.get("/logsUser", logController.getLogsUsers);
app.get("/logsRequest", logController.getLogsRequest);
app.get("/logsStatus", logController.getLogsStatus);
app.get("/logsReferrer", logController.getLogsReferrers);
app.get("/logsTimestamp", logController.getLogsTimestamp);
app.get("/logs/latest", logController.getLatestLogs);

// define routes for adminController
app.post("/login", adminController.login);
app.post("/createUser", adminController.createUser);
app.get("/users", adminController.getUsers);
app.get("/roles", adminController.getRoles);
app.put("/user/:id", adminController.updateUser);
app.get("/profile/:id", adminController.getProfile);
app.put("/profile", adminController.updateProfile);
app.get("/searchUser", adminController.searchUser);

// define routes for companyController
app.get("/company", companyController.getCompany);
app.get("/compUsers", companyController.getCompUsers);
app.get("/searchCompUser", companyController.searchCompUser);
app.get("/industry", companyController.getIndustry);
app.post("/addCompany", companyController.addCompany);
app.get("/positions", companyController.getPositions);

// define routes for employeeController
app.get("/employeeGetUser", employeeController.employeeGetUser);
app.post("/requestLeave", employeeController.requestLeave);
app.get("/getRequestLeave/:id", employeeController.getRequestLeaveByID);
app.get("/leaveBalance/:userid", employeeController.getLeaveBalance);
app.get("/assignments/:userid",employeeController.getAssignmentId);
app.post("/clock-in", employeeController.clockIn);
app.post("/clock-out", employeeController.clockOut);
app.get("/clock-times/:user_id/:assignment_id", employeeController.getClockTimes);
app.put('/update-clock-time',employeeController.updatedClocktime);
app.post("/submitSkill/:userid", employeeController.submitSkill);
app.get('/getUserSkills/:userid', employeeController.userSkill);
app.get('/trainingSessions', employeeController.getAllTrainingSessions);
app.post('/expressInterest', employeeController.expressInterest);
app.get('/trainingSessions/interest/:userId',employeeController.retriveUserInterest);
app.delete('/deleteRequestLeave/:id',employeeController.deleteRequestLeave);
app.post('/submitFeedback',employeeController.submitFeedback);
app.get('/getFeedback/:userId',employeeController.getFeedback);
app.get('/tasks',employeeController.getTask);
app.get('/assignments/user/:userId',employeeController.getUserAssignments);
app.get('/assignments/other/:userId',employeeController.getOtherUsersAssignments);
app.post('/shiftSwapRequests',employeeController.submitSwapRequest);
app.get('/users/:userId/leave_balance',employeeController.getUserLeaveBalance);
app.get('/payrolls/user/:userId',employeeController.getUserPayrolls);
app.post('/payrollQueries',employeeController.submitPayrollQuery);
app.get('/payrollQueries/user/:userId',employeeController.getPayrollQueries);

// define routes for HRController
app.get("/HRGetUser", HRController.HRGetUser);
app.post("/payroll", HRController.createPayroll);
app.get("/positions/:posid", HRController.getPosition);
app.get("/clockTimes/:userid", HRController.getclockTime);
app.get("/calculatePayroll/:userid", HRController.calculatePayroll);
app.get("/user/assignments/:userid", HRController.getUserAssignment);
app.post("/training", HRController.createTrainingSession);
app.get("/getTraining", HRController.getTrainingSessions);
app.put("/updateTraining/:session_id", HRController.updateTrainingSession);
app.delete("/deleteTraining/:id", HRController.deleteTraining);
app.get("/getSkills", HRController.getSkills);
app.post("/postTraining/:interest_id", HRController.postTraining);
app.get("/getAllSessions", HRController.getAllSessions);
app.get("/feedback", HRController.getFeedback);
app.get('/shiftSwapRequests/pending', HRController.getPendingShiftSwapRequests);
app.post('/shiftSwapRequests/handle', HRController.handleShiftSwapRequest);
app.get('/payrollQueries/view', HRController.getPayrollQueries);
app.put('/payrollQueries/respond/:query_id', upload.single('receipt'), HRController.updatePayrollQueries);

// define routes for managerController
app.get("/managerGetUsers", managerController.managerGetUsers);
app.post("/createTask", managerController.createTask);
app.put("/task/:id", managerController.updateTask);
app.get("/tasks", managerController.getTasks);
app.delete("/task/:taskId", managerController.deleteTask);
app.get("/employees", managerController.getEmployees);
app.put("/task/:id/timeslot", managerController.updateTimeslot);
app.delete("/task/:id/timeslot", managerController.deleteTimeslot);
app.post("/addSchedules", managerController.addSchedules);
app.get("/schedules", managerController.getSchedules);
app.put("/updateSchedules/:id", managerController.updateSchedule);
app.delete("/deleteSchedules/:id", managerController.deleteSchedule);
app.post("/autoSchedule", managerController.autoScheduling);
app.get("/assignments", managerController.Assignments);
app.get("/timeoff", managerController.getTimeoffRequests);


app.get("/", (req, res) => {
    res.send("Homepage");
})

const PORT = process.env.PORT || 8800;
app.listen(PORT, console.log(`server started on port ${PORT}`));
