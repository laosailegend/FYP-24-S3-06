require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');
const jwt = require('jsonwebtoken');

const app = express();

// parse every request as json and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// enable cors
app.use(cors());

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
// make frontend for below later
app.get("/logsReferrer", logController.getLogsReferrers);
app.get("/logsTimestamp", logController.getLogsTimestamp);

// define routes for adminController
app.post("/login", adminController.login);
app.post("/createUser", adminController.createUser);
app.get("/users", adminController.getUsers);
app.get("/roles", adminController.getRoles);
app.put("/user/:id", adminController.updateUser);
app.delete("/user/:id", adminController.deleteUser);
app.post("/createPerms", adminController.createPerms);
app.get("/permissions", adminController.getPerms);
app.put("/updatePerms/:id", adminController.updatePerms);
app.delete("/deletePerms/:id", adminController.deletePerms);
app.get("/profile/:id", adminController.getProfile);
app.put("/profile/:id", adminController.updateProfile);
app.get("/searchUser", adminController.searchUser);

// define routes for companyController
app.get("/company", companyController.getCompany);
app.get("/compUsers", companyController.getCompUsers);
app.get("/searchCompUser", companyController.searchCompUser);
app.get("/industry", companyController.getIndustry);
app.post("/addCompany", companyController.addCompany);

// define routes for employeeController
app.get("/employeeGetUser", employeeController.employeeGetUser);
//app.put("/updateAvailability/:id", employeeController.updateAvailability);
app.post("/requestLeave", employeeController.requestLeave);
app.get("/getRequestLeave/:id", employeeController.getRequestLeaveByID);
app.get("/leaveBalance/:userid", employeeController.getLeaveBalance);
//app.get("/schedules/:userid",employeeController.getScheduleId);
//app.post("/clock-in", employeeController.clockIn);
//app.post("/clock-out", employeeController.clockOut);
//app.get("/clock-times/:user_id/:schedule_id", employeeController.getClockTimes);
//app.post("/submit-skills", employeeController.submitSkill);
//app.get('/userSkills/:user_id', employeeController.userSkill);
// app.get('/trainingSessions', employeeController.getAllTrainingSessions);
// app.post('/expressInterest', employeeController.expressInterest);
// app.get('/trainingSessions/interest/:userId',employeeController.retriveUserInterest);
// app.delete('/deleteRequestLeave/:id',employeeController.deleteRequestLeave);
// app.post('/submitFeedback',employeeController.submitFeedback);
// app.get('/getFeedback/:userId',employeeController.getFeedback);

// define routes for HRController
app.get("/HRGetUser", HRController.HRGetUser);
app.get("/timeoff", HRController.getTimeoffRequests);
app.put("/timeoff/:request_id", HRController.updateTimeoffStatus);
app.get("/available", HRController.getAvailStatus);
app.post("/available", HRController.createAvailabilityForm);
app.delete("/available/:id", HRController.deleteAvailabilityForm);
app.get("/getAvailable", HRController.getAvailable);
app.post("/payroll", HRController.createPayroll);
//app.get("/user/schedules/:userId", HRController.getUserSchedule);
// app.post("/training", HRController.createTrainingSession);
// app.get("/getTraining", HRController.getTrainingSessions);
// app.put("/updateTraining/:session_id", HRController.updateTrainingSession);
// app.delete("/deleteTraining/:id", HRController.deleteTraining);
// app.get("/getSkills", HRController.getSkills);
// app.post("/postTraining/:userid/:session_id", HRController.postTraining);
// app.get("/getAllSessions", HRController.getAllSessions);
// app.get("/feedback", HRController.getFeedback);

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
// app.get("/assignments", managerController.Assignments);


app.get("/", (req, res) => {
    res.send("Homepage");
})

const PORT = process.env.PORT || 8800;
app.listen(PORT, console.log(`server started on port ${PORT}`));
