from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Argument(models.Model):
    content = models.TextField()  # Textual content of the argument
    is_topic = models.BooleanField(default=False)  # Indicates if it's the main topic or a regular argument
    created_at = models.DateTimeField(auto_now_add=True)  # Automatic creation timestamp
    updated_at = models.DateTimeField(auto_now=True)  # Automatic update timestamp
    position_x = models.FloatField(default=0)  # X-coordinate of the argument on the canvas
    position_y = models.FloatField(default=0)  # Y-coordinate of the argument on the canvas
    
    def __str__(self):
        return f"Argument (id: {self.id}, {'Topic' if self.is_topic else 'Regular'})"


class Operator(models.Model):
    STANCE_CHOICES = [
        ('against', 'Against'),
        ('for', 'For'),
        ('undefined', 'Undefined'),
    ]
    stance = models.CharField(
        max_length=10,  # Ensure the max length covers the longest choice ('undefined' has 9 characters)
        choices=STANCE_CHOICES,
        default='undefined',  # Default value if no value is provided
    )
    
    
    OPERATOR_TYPE_CHOICES = [
        ('AND', 'AND Operator'),
        ('OR', 'OR Operator'),
    ]
    type = models.CharField(max_length=3, choices=OPERATOR_TYPE_CHOICES)  # AND/OR type
    created_at = models.DateTimeField(auto_now_add=True)  # Automatic creation timestamp
    updated_at = models.DateTimeField(auto_now=True)  # Automatic update timestamp

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

    created_at = models.DateTimeField(auto_now_add=True)  # Automatic creation timestamp
    updated_at = models.DateTimeField(auto_now=True)  # Automatic update timestamp

    def __str__(self):
        return f"Connection (Input: {self.input_object}, Output: {self.output_object})"


class Log(models.Model):
    argument = models.ForeignKey(Argument, on_delete=models.CASCADE, related_name="logs")
    timestamp = models.DateTimeField(auto_now_add=True)  # When the change was made
    change_description = models.TextField()  # Description of what changed

    def __str__(self):
        return f"Log (Argument id: {self.argument.id}, timestamp: {self.timestamp})"
