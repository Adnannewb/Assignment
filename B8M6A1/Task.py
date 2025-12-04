import random
class Task: 
    def __init__(self, title, description, created_at, id=None):
        self.id = id if id is not None else random.randint(1, 1000)
        self.title = title 
        self.description = description 
        self.created_at = created_at
    def todictionary(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "created_at": self.created_at
        }
    @classmethod
    def fromdictionary(cls,d):
        return cls(
            title=d.get("title",""),
            description=d.get("description",""),
            created_at=d.get("created_at"),
            id=d.get("id")

        )
