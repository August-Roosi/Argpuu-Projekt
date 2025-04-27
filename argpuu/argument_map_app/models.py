from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.db import models
from django.contrib.auth.models import User
import uuid


class ArgumentMap(models.Model):
    title = models.CharField(max_length=255)  
    description = models.CharField(max_length=255, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="argument_trees")
    contributors = models.ManyToManyField(User, related_name="collaborations", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True)  

    def __str__(self):
        return f"Argument Map (id: {self.id}, title: {self.title})"


class Argument(models.Model):
    content = models.CharField(blank=True, null=True, max_length=1000)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="arguments")
    contributors = models.ManyToManyField(User, related_name="argument_contributions", blank=True)
    is_root = models.BooleanField(default=False)
    argument_map = models.ForeignKey(ArgumentMap, on_delete=models.CASCADE, related_name="arguments", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    position_x = models.FloatField(default=0)
    position_y = models.FloatField(default=0)
    
    def __str__(self):
        return f"Argument (id: {self.id})"
    

class Operator(models.Model):
    
    OPERATOR_TYPE_CHOICES = [
        ('AND', 'AND Operator'),
        ('OR', 'OR Operator'),
    ]
    type = models.CharField(max_length=3, choices=OPERATOR_TYPE_CHOICES)  
    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True)  

    def __str__(self):
        return f"Operator (id: {self.id}, type: {self.get_type_display()})"


class Connection(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="connections")
    explanation = models.CharField(max_length=50, null=True)
    argument_map = models.ForeignKey(ArgumentMap, on_delete=models.CASCADE, related_name="connections")
    source_argument = models.ForeignKey(Argument, on_delete=models.CASCADE, related_name="source_connections")
    target_argument = models.ForeignKey(Argument, on_delete=models.CASCADE, related_name="target_connections")
    operator = models.ForeignKey(Operator, on_delete=models.CASCADE, related_name="operators", null=True, blank=True)

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

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=~models.Q(source_argument=models.F('target_argument')),
                name='prevent_self_connection',
            )
        ]


    def __str__(self):
        return f"Connection (Source ID: {self.source_argument.id}, Target ID: {self.target_argument.id}, Stance: {self.get_stance_display()})"



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

