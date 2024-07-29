const express = require('express');
const app = express();

app.use("/", (req, res) => {
    res.send("server is runningigingngn");
})

app.listen(5000, console.log("serve started on port 5000"));