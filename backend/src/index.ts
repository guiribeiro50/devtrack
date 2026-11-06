import express from 'express';
import type { Task } from './models/task.js';

const app = express();
const port = 3000;

app.use(express.json());

const tasks: Task[] = [];
let nextId = 1;

const validStatuses = ['backlog', 'ready', 'in-progress', 'in-review', 'done'];
const validPriorities = ['low', 'medium', 'high', 'urgent'];
const allowedFields = ['title', 'desc', 'assignee', 'status', 'priority'];

app.get('/', (req, res) => {
    res.send('Welcome to DevTrack API');
});

app.post('/api/tasks', (req, res) => {
    if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
        return res.status(400).json({
            error: 'Invalid request body',
            message: 'The request body must be a JSON object.',
        });
    }

    const { title, desc, assignee, priority } = req.body;

    if (
        typeof title !== 'string' ||
        !title.trim() ||
        typeof desc !== 'string' ||
        !desc.trim() ||
        typeof assignee !== 'string' ||
        !assignee.trim()
    ) {
        return res.status(400).json({
            error: 'Invalid task data',
            message: 'Title, description and assignee are required and must be non-empty strings.',
        });
    }

    if (!validPriorities.includes(priority)) {
        return res.status(400).json({
            error: 'Invalid priority',
            message: 'The provided priority is not valid.',
        });
    }

    const newTask: Task = {
        id: nextId++,
        title: title.trim(),
        desc: desc.trim(),
        assignee: assignee.trim(),
        status: 'backlog',
        priority,
    };

    tasks.push(newTask);

    return res.status(201).json(newTask);
});

app.get('/api/tasks', (req, res) => {
    const status = req.query.status;
    const priority = req.query.priority;
    const assignee = req.query.assignee;

    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
    const offset = (page - 1) * limit;

    if (Number.isNaN(page) || !Number.isInteger(page) || page <= 0) {
        return res.status(400).json({
            error: 'Invalid page',
            message: 'The page parameter must be a positive integer.',
        });
    }

    if (Number.isNaN(limit) || !Number.isInteger(limit) || limit <= 0 || limit > 100) {
        return res.status(400).json({
            error: 'Invalid limit',
            message: 'The limit parameter must be a positive integer between 1 and 100.',
        });
    }

    let filteredTasks = tasks;

    if (status !== undefined) {
        if (typeof status !== 'string' || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                message: 'The provided status is not valid.',
            });
        }

        filteredTasks = filteredTasks.filter((task) => task.status === status);
    }

    if (priority !== undefined) {
        if (typeof priority !== 'string' || !validPriorities.includes(priority)) {
            return res.status(400).json({
                error: 'Invalid priority',
                message: 'The provided priority is not valid.',
            });
        }

        filteredTasks = filteredTasks.filter((task) => task.priority === priority);
    }

    if (assignee !== undefined) {
        if (typeof assignee !== 'string' || !assignee.trim()) {
            return res.status(400).json({
                error: 'Invalid assignee',
                message: 'The provided assignee is not valid.',
            });
        }

        filteredTasks = filteredTasks.filter((task) => task.assignee === assignee.trim());
    }

    const paginatedTasks = filteredTasks.slice(offset, offset + limit);
    const totalTasks = filteredTasks.length;
    const totalPages = Math.ceil(totalTasks / limit);

    return res.status(200).json({
        data: paginatedTasks,
        pagination: {
            currentPage: page,
            limit,
            totalTasks,
            totalPages,
        },
    });
});

app.get('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid task ID',
            message: 'The task ID must be a positive integer.',
        });
    }

    const task = tasks.find((task) => task.id === id);

    if (!task) {
        return res.status(404).json({
            error: 'Task not found',
            message: `Task with ID ${id} was not found.`,
        });
    }

    return res.status(200).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid task ID',
            message: 'The task ID must be a positive integer.',
        });
    }

    if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
        return res.status(400).json({
            error: 'Invalid request body',
            message: 'The request body must be a JSON object.',
        });
    }

    const update = req.body;
    const fields = Object.keys(update);

    if (fields.length === 0) {
        return res.status(400).json({
            error: 'Empty update',
            message: 'At least one field must be provided.',
        });
    }

    const invalidFields = fields.filter((field) => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
        return res.status(400).json({
            error: 'Invalid fields',
            message: `The following fields cannot be updated: ${invalidFields.join(', ')}.`,
        });
    }

    for (const field of fields) {
        if (typeof update[field] !== 'string' || !update[field].trim()) {
            return res.status(400).json({
                error: 'Invalid field value',
                message: `The field '${field}' must be a non-empty string.`,
            });
        }

        update[field] = update[field].trim();
    }

    if (update.status !== undefined && !validStatuses.includes(update.status)) {
        return res.status(400).json({
            error: 'Invalid status',
            message: 'The provided status is not valid.',
        });
    }

    if (update.priority !== undefined && !validPriorities.includes(update.priority)) {
        return res.status(400).json({
            error: 'Invalid priority',
            message: 'The provided priority is not valid.',
        });
    }

    const task = tasks.find((task) => task.id === id);

    if (!task) {
        return res.status(404).json({
            error: 'Task not found',
            message: `Task with ID ${id} was not found.`,
        });
    }

    Object.assign(task, update);

    return res.status(200).json({
        message: 'Task updated successfully',
        task,
    });
});

app.delete('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid task ID',
            message: 'The task ID must be a positive integer.',
        });
    }

    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).json({
            error: 'Task not found',
            message: `Task with ID ${id} was not found.`,
        });
    }

    tasks.splice(taskIndex, 1);

    return res.status(200).json({
        message: 'Task deleted successfully',
    });
});

app.listen(port, () => {
    console.log(`DevTrack API is running at http://localhost:${port}`);
});
