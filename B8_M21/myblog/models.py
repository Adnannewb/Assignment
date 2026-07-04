from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Category(models.Model):
    name=models.CharField(max_length=50)
    
    def __str__(self):
        return self.name

class Tag(models.Model):
    name=models.CharField(max_length=50)
    def __str__(self):
        return self.name

class Post(models.Model):
    title=models.CharField(max_length=100)
    content=models.TextField(verbose_name="content")
    author=models.ForeignKey(User,on_delete=models.CASCADE)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    category=models.ForeignKey(Category,on_delete=models.SET_NULL,null=True)
    tag=models.ManyToManyField(Tag)
    view_count=models.BigIntegerField(default=0)
    liked_user=models.ManyToManyField(User,related_name="liked_posts")
    
    def __str__(self):
        return self.title

class Comment(models.Model):
    content=models.TextField()
    author=models.ForeignKey(User,on_delete=models.CASCADE)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    post=models.ForeignKey(Post,on_delete=models.CASCADE)
    
    def __str__(self):
        return self.post.title
    
