import express from "express";
import type { Task } from "./models/task.js";

const app = express();
const port = 3000;
const tasks: Task[] = [];
let nextId = 1;
const validStatuses = ["backlog", "ready", "in-progress", "in-review", "done"];
const validPriorities = ["low", "medium", "high", "urgent"];

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Welcome to DevTrack API");
});

app.post('/api/tasks', (req, res) => {

    if (
        typeof req.body.title !== "string" || !req.body.title.trim() ||
        typeof req.body.desc !== "string" || !req.body.desc.trim() ||
        typeof req.body.assignee !== "string" || !req.body.assignee.trim()
    ) {
        return res.status(400).json({
            error: "Missing required fields",
            message: "Fields 'title', 'desc' and 'assignee' are required."
        });
    }

    if (!validPriorities.includes(req.body.priority)) {
        return res.status(400).json({
            error: "Invalid priority",
            message: "The provided priority is not valid."
        });
    }

    const newTask: Task = {
        id: nextId++,
        title: req.body.title.trim(),
        desc: req.body.desc.trim(),
        assignee: req.body.assignee.trim(),
        status: "backlog",
        priority: req.body.priority.trim()
    };

    tasks.push(newTask);

    return res.status(201).json({
        message: "Task created successfully",
        task: newTask
    });
})

app.get('/api/tasks', (req, res) => {
    res.status(200).json(tasks);
})

app.listen(port, () => {
    console.log(`DevTrack server running on port ${port}`);
});