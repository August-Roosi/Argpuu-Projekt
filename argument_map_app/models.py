from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.db import models
from django.contrib.auth.models import User
import uuid




class ArgumentMap(models.Model):
    title = models.CharField(max_length=255)  
    description = models.CharField(max_length=255, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="argument_trees")
    viewers = models.ManyToManyField(User, related_name="viewers_argument_maps", blank=True)
    editors = models.ManyToManyField(User, related_name="editors_argument_maps", blank=True)
    contributors = models.ManyToManyField(User, related_name="collaborations", blank=True)
    is_public = models.BooleanField(default=False)
    is_publicly_editable = models.BooleanField(default=False)
    likes = models.ManyToManyField(User, related_name="liked_argument_maps", blank=True)
    dislikes = models.ManyToManyField(User, related_name="disliked_argument_maps", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True)  

    def __str__(self):
        return f"Argument Map (id: {self.id}, title: {self.title})"


class Argument(models.Model):
    content = models.CharField(blank=True, null=True, max_length=1000)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="arguments")
    is_root = models.BooleanField(default=False)
    argument_map = models.ForeignKey(ArgumentMap, on_delete=models.CASCADE, related_name="root_arguments", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Argument (id: {self.id})"
    

class Operator(models.Model):
    OPERATOR_TYPE_CHOICES = [
        ('AND', 'AND Operator'),
        ('OR', 'OR Operator'),
    ]
    argument_map = models.ForeignKey(ArgumentMap, on_delete=models.CASCADE, related_name="operators")
    arguments = models.ManyToManyField('Argument', related_name="operators", blank=True)
    operator_type = models.CharField(max_length=3, choices=OPERATOR_TYPE_CHOICES, blank=True)  
    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True)  
    

    def __str__(self):
        return f"Operator (id: {self.id}, type: {self.get_operator_type_display()})"

    def auto_set_type(self):
        argument_count = self.arguments.count()
        self.operator_type = 'OR' if argument_count > 1 else 'AND'
        self.save()

class Connection(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="connections")
    explanation = models.CharField(max_length=50, null=True)
    argument_map = models.ForeignKey(ArgumentMap, on_delete=models.CASCADE, related_name="connections")
    source_argument = models.ForeignKey(Argument, on_delete=models.CASCADE, related_name="source_connections")
    target_operator = models.ForeignKey(Operator, on_delete=models.CASCADE, related_name="target_connections")

    STANCE_CHOICES = [
        ('against', 'Against'),
        ('for', 'For'),
        ('undefined', 'Undefined'),
    ]
    stance = models.CharField(
        max_length=10,  
        choices=STANCE_CHOICES,
        default='undefined',  
    )

    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True)  



    def __str__(self):
        return f"Connection (Source ID: {self.source_argument.id}, Target ID: {self.target_operator.id}, Stance: {self.get_stance_display()})"




class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    argument_map = models.ForeignKey("ArgumentMap", on_delete=models.CASCADE, related_name="logs")
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    target = GenericForeignKey('content_type', 'object_id')
    
    change_type = models.TextField()
    change_description = models.TextField()
    data_before = models.JSONField()
    data_after = models.JSONField()
    action_group_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    undone = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

