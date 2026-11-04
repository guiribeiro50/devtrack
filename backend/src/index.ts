import express from "express";

const app = express();
const port = 3000;

app.listen(port, () => {
    console.log(`DevTrack server running on port ${port}`)
});

app.get('/', (resq, res) => {
    res.send("Welcome to DevTrack API");
})