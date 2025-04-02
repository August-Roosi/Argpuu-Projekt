from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from ..models import Argument, Operator, Connection
from rest_framework import serializers

class ArgumentSerializer(serializers.ModelSerializer):
    position = serializers.SerializerMethodField()
    data = serializers.JSONField(write_only=True)  # Accepts `data` field in input JSON

    class Meta:
        model = Argument
        fields = ['id', 'position', 'data']

    def get_position(self, obj):
        return {'x': obj.position_x, 'y': obj.position_y}

    def to_representation(self, instance):
        """Customize the output format"""
        data = super().to_representation(instance)

        data['id'] = str(instance.id)  

        data['data'] = {
            'content': instance.content,
        }
        return data

    def create(self):
        position_data = self.initial_data.get('position', {})
        data_field = self.initial_data.get('data', {})

        argument = Argument.objects.create(
            content=data_field.get('content', ''),
            position_x=position_data.get('x', 0),
            position_y=position_data.get('y', 0)
        )
        return argument

    def update(self, instance):
        position_data = self.initial_data.get('position', {})
        data_field = self.initial_data.get('data', {})

        instance.position_x = position_data.get('x', instance.position_x)
        instance.position_y = position_data.get('y', instance.position_y)
        instance.content = data_field.get('content', instance.content)
            
        instance.save()
        return instance
