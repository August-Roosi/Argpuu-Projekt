from django.contrib import admin
from .models import ArgumentMap, Argument, Operator, Connection, Log
from django.utils.html import format_html

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
    

@admin.register(Log)
class LogAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'argument_map',
        'action_group_id',
        'content_type',
        'object_id',
        'object_link',
        'change_description',
        'change_type',
        'undone',
        'created_at',
    )
    list_filter = (
        'undone',
        'created_at',
        'content_type',
        'argument_map',
    )
    search_fields = (
        'user__username',
        'change_description',
        'change_type',
        'action_group_id',
        'object_id',
    )
    readonly_fields = (
        'user',
        'argument_map',
        'content_type',
        'object_id',
        'target',
        'change_description',
        'change_type',
        'data_before',
        'data_after',
        'action_group_id',
        'undone',
        'created_at',
        'object_link',
    )
    ordering = ('-created_at',)

    def object_link(self, obj):
        """Create a link to the admin change page of the related object."""
        if obj.content_type and obj.object_id:
            try:
                url = f"/admin/{obj.content_type.app_label}/{obj.content_type.model}/{obj.object_id}/change/"
                return format_html('<a href="{}">{} {}</a>', url, obj.content_type.model.title(), obj.object_id)
            except Exception:
                return "—"
        return "—"
    
    object_link.short_description = "Object Link"
