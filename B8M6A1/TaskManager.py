import json
import os
from Task import Task

class TaskManager:
    def __init__(self, filename="tasks.json"):
        self.filename = filename
        self.tasks = []
        self.load_from_file()

    def add_task(self,title, description,created_at):
        t = Task(title, description,created_at)
        self.tasks.append(t)
        self.save_to_file()
        return t

    def view_tasks(self):
        return self.tasks

    def update_task(self, index, new_title, new_description,new_created_at):
        try:
            t = self.tasks[index]
        except IndexError:
            raise IndexError("Invalid task number")
        if new_title:
            t.title = new_title
        if new_description:
            t.description = new_description
        if new_created_at:
            t.created_at = new_created_at
        self.save_to_file()
        return t

    def delete_task(self,index):
        try:
            t = self.tasks.pop(index)
            self.save_to_file()
            return t
        except IndexError:
            raise IndexError("Invalid Task number")

    def save_to_file(self):
        folder = "B8M6A1"
        filepath = os.path.join(folder, self.filename)
        if not os.path.exists(folder):
            os.makedirs(folder)
        with open(filepath, "w") as f:
            json.dump([t.todictionary() for t in self.tasks], f)   

    def load_from_file(self):
        folder = "B8M6A1"
        filepath = os.path.join(folder, self.filename)
        if not os.path.exists(filepath):
            self.tasks = []
            return
        try:
            with open(filepath,"r") as f:
                data = json.load(f)
                self.tasks = [Task.fromdictionary(d) for d in data]
        except json.JSONDecodeError:
            print("Tasks.json is corrupted.")
            self.tasks = []
        except Exception as e:
            print("Could not load tasks.", e)
            self.tasks = []
