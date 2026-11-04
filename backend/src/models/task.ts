type TaskStatus = "backlog" | "ready" | "in-progress" | "in-review" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface Task {
    title: string;
    desc: string;
    assignee: string;
    status: TaskStatus;
    priority: TaskPriority;
}