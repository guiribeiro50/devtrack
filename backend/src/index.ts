
import express from "express";
import type { Task } from "./models/task.js";

const app = express();
const port = 3000;
const tasks: Task[] = [];
let nextId = 1;
const validStatuses = ["backlog", "ready", "in-progress", "in-review", "done"];
const validPriorities = ["low", "medium", "high", "urgent"];
const allowedFields = ["title", "desc", "assignee", "status", "priority"];

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Welcome to DevTrack API");
});

app.post('/api/tasks', (req, res) => {

    if (
        typeof req.body !== "object" || req.body === null || Array.isArray(req.body) ||
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
});

app.get('/api/tasks', (req, res) => {
    const status = req.query.status;
    const priority = req.query.priority;
    const assignee = req.query.assignee;
    let filteredTasks = tasks;

    if (status !== undefined) {
        if (typeof status !== "string" || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid status",
                message: "The provided status is not valid."
            });
        }

        filteredTasks = filteredTasks.filter(task => task.status === status);
    }

    if (priority !== undefined) {
        if (typeof priority !== "string" || !validPriorities.includes(priority)) {
            return res.status(400).json({
                error: "Invalid priority",
                message: "The provided priority is not valid."
            });
        }

        filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }

    if (assignee !== undefined) {
        if (typeof assignee !== "string" || !assignee.trim()) {
            return res.status(400).json({
                error: "Invalid assignee",
                message: "The provided assignee is not valid."
            });
        }

        filteredTasks = filteredTasks.filter(task => task.assignee === assignee.trim());
    }

    return res.status(200).json(filteredTasks);
});

app.get('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: "Invalid task ID",
            message: "The provided task ID must be a positive integer."
        });
    }

    const found = tasks.find(element => element.id === id);

    if (!found) {
        return res.status(404).json({
            error: "Task not found",
            message: "No task was found with the provided ID."
        });
    }

    return res.status(200).json(found);
});

app.patch('/api/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
        return res.status(400).json({
            error: "Invalid task ID",
            message: "The provided task ID must be a positive integer."
        });
    }

    if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
        return res.status(400).json({
            error: "Invalid request body",
            message: "The request body must be a valid JSON object."
        });
    }

    const receivedFields = Object.keys(req.body);

    if (receivedFields.length === 0) {
        return res.status(400).json({
            error: "Empty request body",
            message: "At least one field must be provided for the update."
        });
    }

    const hasInvalidFields = receivedFields.some(field => !allowedFields.includes(field));

    if (hasInvalidFields) {
        return res.status(400).json({
            error: "Invalid fields",
            message: "The request contains fields that cannot be updated."
        });
    }

    const task = tasks.find(element => element.id === taskId);

    if (!task) {
        return res.status(404).json({
            error: "Task not found",
            message: "No task was found with the provided ID."
        });
    }

    const update = req.body;

    if (update.title !== undefined) {
        if (typeof update.title !== "string" || !update.title.trim()) {
            return res.status(400).json({
                error: "Invalid title",
                message: "The title must be a non-empty string."
            });
        }

        update.title = update.title.trim();
    }

    if (update.desc !== undefined) {
        if (typeof update.desc !== "string" || !update.desc.trim()) {
            return res.status(400).json({
                error: "Invalid description",
                message: "The description must be a non-empty string."
            });
        }

        update.desc = update.desc.trim();
    }

    if (update.assignee !== undefined) {
        if (typeof update.assignee !== "string" || !update.assignee.trim()) {
            return res.status(400).json({
                error: "Invalid assignee",
                message: "The assignee must be a non-empty string."
            });
        }

        update.assignee = update.assignee.trim();
    }

    if (update.priority !== undefined && !validPriorities.includes(update.priority)) {
        return res.status(400).json({
            error: "Invalid priority",
            message: "The provided priority is not valid."
        });
    }

    if (update.status !== undefined && !validStatuses.includes(update.status)) {
        return res.status(400).json({
            error: "Invalid status",
            message: "The provided status is not valid."
        });
    }

    Object.assign(task, update);

    return res.status(200).json({
        message: "Task updated successfully",
        task
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
        return res.status(400).json({
            error: "Invalid task ID",
            message: "The provided task ID must be a positive integer."
        });
    }

    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({
            error: "Task not found",
            message: "No task was found with the provided ID."
        });
    }

    tasks.splice(taskIndex, 1);

    return res.status(200).json({
        message: "Task deleted successfully"
    });
});

app.listen(port, () => {
    console.log(`DevTrack server running on port ${port}`);
});
