from rest_framework import serializers
from ..models import Argument, ArgumentMap, Operator, Connection


class ArgumentSerializer(serializers.ModelSerializer):
    position = serializers.SerializerMethodField()
    data = serializers.JSONField(write_only=True)
    argument_map = serializers.PrimaryKeyRelatedField(
        queryset=Argument.argument_map.rel.model.objects.all(),
        many=True
    )

    class Meta:
        model = Argument
        fields = ['id', 'position', 'argument_map', 'data']

    def get_position(self, obj):
        return {'x': obj.position_x, 'y': obj.position_y}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.id)
        data['data'] = {'content': instance.content, 'argument_map': [str(obj.id) for obj in instance.argument_map.all()]}
        return data

    def create(self, validated_data):
        position_data = self.initial_data.get('position', {})
        data_field = self.initial_data.get('data', {})
        argument_map_ids = [obj.id if hasattr(obj, 'id') else obj for obj in validated_data.pop('argument_map', [])]

        argument = Argument.objects.create(
            author=self.context['request'].user,
            content=data_field.get('content'),
            position_x=position_data.get('x', 0),
            position_y=position_data.get('y', 0),
        )
        argument.argument_map.set(argument_map_ids)
        return argument

    def update(self, instance, validated_data):
        position_data = self.initial_data.get('position', {})
        data_field = self.initial_data.get('data', {})

        instance.position_x = position_data.get('x', instance.position_x)
        instance.position_y = position_data.get('y', instance.position_y)
        instance.content = data_field.get('content', instance.content)

        if 'argument_map' in validated_data:
            argument_map_ids = validated_data.pop('argument_map')
            instance.argument_map.set(argument_map_ids)

        instance.save()
        return instance
    
class ConnectionSerializer(serializers.ModelSerializer):
    argument_map = serializers.PrimaryKeyRelatedField(
        queryset=ArgumentMap.objects.all()
    )
    source = serializers.PrimaryKeyRelatedField(
        source='source_argument',
        queryset=Argument.objects.all()
    )
    target = serializers.PrimaryKeyRelatedField(
        source='target_argument',
        queryset=Argument.objects.all()
    )
    explanation = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = Connection
        fields = ['id', 'source', 'target', 'explanation', 'argument_map']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = str(rep['id'])
        rep['source'] = str(instance.source_argument.id)
        rep['target'] = str(instance.target_argument.id)
        return rep

    def create(self, validated_data):
        return Connection.objects.create(
            author=self.context['request'].user,
            **validated_data
        )
