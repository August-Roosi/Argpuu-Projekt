from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User


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
    content = models.TextField()
    argument_map = models.ManyToManyField(ArgumentMap, related_name="arguments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    position_x = models.FloatField(default=0)
    position_y = models.FloatField(default=0)
    
    def __str__(self):
        return f"Argument (id: {self.id})"
    


class Operator(models.Model):
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
    
    # Generic foreign key for the input
    input_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name="input_connections")
    input_object_id = models.PositiveIntegerField()
    input_object = GenericForeignKey('input_content_type', 'input_object_id')

    # Generic foreign key for the output
    output_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name="output_connections")
    output_object_id = models.PositiveIntegerField()
    output_object = GenericForeignKey('output_content_type', 'output_object_id')

    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True)  

    def __str__(self):
        return f"Connection (Input: {self.input_object}, Output: {self.output_object})"


class Log(models.Model):
    argument = models.ForeignKey(Argument, on_delete=models.CASCADE, related_name="logs")
    timestamp = models.DateTimeField(auto_now_add=True)  
    change_description = models.TextField()  

    def __str__(self):
        return f"Log (Argument id: {self.argument.id}, timestamp: {self.timestamp})"
