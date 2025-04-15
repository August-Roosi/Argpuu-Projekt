from django.contrib import admin
from .models import ArgumentMap, Argument, Operator, Connection

@admin.register(ArgumentMap)
class ArgumentMapAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'description', 'author', 'created_at', 'updated_at')
    list_filter = ('author', 'created_at')
    search_fields = ('title',)

@admin.register(Argument)
class ArgumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'content', 'created_at', 'updated_at')
    list_filter = ( "content",'created_at')
    search_fields = ('content',)

@admin.register(Operator)
class OperatorAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'created_at', 'updated_at')
    list_filter = ('type', 'created_at')
    search_fields = ('type',)

@admin.register(Connection)
class ConnectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'source_argument', 'target_argument', 'operator', 'stance', 'created_at', 'updated_at')
    list_filter = ('operator', 'stance', 'created_at')
    search_fields = ('source_argument__content', 'target_argument__content')