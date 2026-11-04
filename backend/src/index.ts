import express from "express";

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send("Welcome to DevTrack API");
});

app.listen(port, () => {
    console.log(`DevTrack server running on port ${port}`);
});