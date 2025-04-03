from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


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
    explanation = models.CharField(max_length=50, null=True)
    input_argument = models.ForeignKey(Argument, on_delete=models.CASCADE, related_name="input_connections")
    output_argument = models.ForeignKey(Argument, on_delete=models.CASCADE, related_name="output_connections")
    operator = models.ForeignKey(Operator, on_delete=models.CASCADE, related_name="connections", null=True, blank=True)

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
                check=~models.Q(input_argument=models.F('output_argument')),
                name='prevent_self_connection',
            )
        ]


    def __str__(self):
        return f"Connection (Input ID: {self.input_argument.id}, Output ID: {self.output_argument.id}, Stance: {self.get_stance_display()})"


class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="logs")
    argument = models.ForeignKey(Argument, on_delete=models.CASCADE, related_name="logs")
    timestamp = models.DateTimeField(auto_now_add=True)  
    change_description = models.TextField()  

    def __str__(self):
        return f"Log (Argument id: {self.argument.id}, timestamp: {self.timestamp})"
