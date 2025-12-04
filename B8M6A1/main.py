from TaskManager import TaskManager
from datetime import datetime

if __name__ == "__main__":
    tasks = TaskManager()
    while True:
        print("===== Student Task Tracker ===== ")
        print("1. Add New Task\n2. View All Tasks\n3. Update Task\n4. Delete Task\n5. Exit ")
        try:
            choice = int(input("Enter Your Choice(between 1-5): "))
        except ValueError:
            print("Invalid choice! Enter a number between 1-5.")
            continue
        if choice == 5:
            print("Thank You for using!")
            break
        if choice not in [1, 2, 3, 4]:
            print("Invalid choice! Enter a number between 1-5.")
            continue
        if choice == 1:
            title = input("Enter Title: ").strip().capitalize()
            if not title:
                print("Input Title")
                continue
            description = input("Enter Description: ").strip().capitalize()
            created_at = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
            t = tasks.add_task(title, description, created_at)
            print("Task added successfully!")
        elif choice == 2:
            details = tasks.view_tasks()
            if not details:
                print("No Tasks Yet.")
            else:
                for i, t in enumerate(details):
                    print(f"Task Number {i+1}. [{t.id}] {t.title} — {t.description} (created: {t.created_at})")
        elif choice == 3:
            try:
                n = int(input("Enter task number to update: ").strip()) - 1
                title = input("Enter Title: ").strip().capitalize()
                if not title:
                    print("Input Title")
                    continue
                description = input("Enter Description: ").strip().capitalize()
                created_at = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
                updated = tasks.update_task(n, title, description, created_at)
                print("Updated Successfully")
            except ValueError:
                print("Please enter a number.")
            except IndexError as e:
                print("Out of bound")
        elif choice == 4:
            task = tasks.view_tasks()
            if not task:
                print("No task to delete")
                continue
            try:
                n = int(input("Enter Task number to Delete: ").strip()) - 1
                delete = tasks.delete_task(n)
                print("Deleted Successfully")
            except ValueError:
                print("Please enter a number.")
            except IndexError as e:
                print("Out of Bound")
