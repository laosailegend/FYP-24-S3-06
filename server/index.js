require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

// parse every request as json
app.use(express.json());

// enable cors
app.use(cors());

// import controllers
const adminController = require('./controller/adminController');
const employeeController = require('./controller/employeeController');
const HRController = require('./controller/HRController');
const managerController = require('./controller/managerController');

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

// define routes for employeeController
app.get("/employeeGetUser", employeeController.employeeGetUser);
app.put("/updateAvailability/:id", employeeController.updateAvailability);
app.post("/requestLeave", employeeController.requestLeave);
app.get("/getRequestLeave/:id", employeeController.getRequestLeaveByID);
app.get("/leaveBalance/:userid", employeeController.getLeaveBalance);
app.get("/schedules/:userid",employeeController.getScheduleId);
app.post("/clock-in", employeeController.clockIn);
app.post("/clock-out", employeeController.clockOut);
app.get("/clock-times/:user_id/:schedule_id", employeeController.getClockTimes);
app.post("/submit-skills", employeeController.submitSkill);
app.get('/userSkills/:user_id', employeeController.userSkill);

// define routes for HRController
app.get("/HRGetUser", HRController.HRGetUser);
app.get("/timeoff", HRController.getTimeoffRequests);
app.put("/timeoff/:request_id", HRController.updateTimeoffStatus);
app.get("/available", HRController.getAvailStatus);
app.post("/available", HRController.createAvailabilityForm);
app.delete("/available/:id", HRController.deleteAvailabilityForm);
app.get("/getAvailable", HRController.getAvailable);
app.post("/payroll", HRController.createPayroll);
app.get("/user/schedules/:userId", HRController.getUserSchedule);

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


app.get("/", (req, res) => {
    res.send("Homepage");
})

app.listen(8800, console.log("server started on port 8800"));