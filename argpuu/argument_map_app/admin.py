from django.contrib import admin
from .models import Argument, Operator, Connection

@admin.register(Argument)
class ArgumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'content', 'is_topic', 'created_at', 'updated_at')
    list_filter = ('is_topic', 'created_at')
    search_fields = ('content',)

@admin.register(Operator)
class OperatorAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'created_at', 'updated_at')
    list_filter = ('type', 'created_at')
    search_fields = ('type',)

@admin.register(Connection)
class ConnectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'input_content_type', 'input_object_id', 'output_content_type', 'output_object_id', 'created_at', 'updated_at')
    list_filter = ('input_content_type', 'output_content_type', 'created_at')
    search_fields = ('input_object_id', 'output_object_id')
