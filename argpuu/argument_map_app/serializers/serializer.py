from rest_framework import serializers
from ..models import Argument, ArgumentMap, Operator, Connection, Log
from ..utils.create_log import create_log

class ArgumentSerializer(serializers.ModelSerializer):
    position = serializers.SerializerMethodField()
    data = serializers.JSONField(write_only=True)

    class Meta:
        model = Argument
        fields = ['id', 'position', 'data']

    def get_position(self, obj):
        return {'x': obj.position_x, 'y': obj.position_y}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.id)
        data['data'] = {'content': instance.content, 'is_root': instance.is_root}
        return data

    def create(self, validated_data):
        position_data = self.initial_data.get('position', {})
        data_field = self.initial_data.get('data', {})

        argument = Argument.objects.create(
            author=self.context['request'].user,
            content=data_field.get('content'),
            position_x=position_data.get('x', 0),
            position_y=position_data.get('y', 0),
        )
        
        argument_map_id = self.context['argument_map_id']
        argument_map = ArgumentMap.objects.get(id=argument_map_id)

        create_log(
            user=self.context['request'].user,
            instance=argument,
            argument_map=argument_map,
            change_type="argument_created",
            description="Created an argument",
            data_before={},
            data_after=ArgumentSerializer(argument).data,
            group_id=self.context.get('action_group_id')
        )
        return argument

    def update(self, instance, validated_data):
        before = ArgumentSerializer(instance).data
        position_data = self.initial_data.get('position', {})
        data_field = self.initial_data.get('data', {})

        instance.position_x = position_data.get('x', instance.position_x)
        instance.position_y = position_data.get('y', instance.position_y)
        instance.content = data_field.get('content', instance.content)

        argument_map_id = self.context['argument_map_id']
        argument_map = ArgumentMap.objects.get(id=argument_map_id)
        
        instance.save()
        create_log(
            user=self.context['request'].user,
            instance=instance,
            argument_map=argument_map,
            change_type="argument_updated",
            description="Updated an argument",
            data_before=before,
            data_after=ArgumentSerializer(instance).data,
            group_id=self.context.get('action_group_id')
        )
        return instance
    
class ConnectionSerializer(serializers.ModelSerializer):
    argument_map = serializers.PrimaryKeyRelatedField(queryset=ArgumentMap.objects.all())
    source = serializers.PrimaryKeyRelatedField(source='source_argument', queryset=Argument.objects.all())
    target = serializers.PrimaryKeyRelatedField(source='target_argument', queryset=Argument.objects.all())
    data = serializers.JSONField(write_only=True)
    
    class Meta:
        model = Connection
        fields = ['id', 'source', 'target', 'argument_map', 'data']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = str(rep['id'])
        rep['source'] = str(instance.source_argument.id)
        rep['target'] = str(instance.target_argument.id)
        rep['data'] = {'stance': instance.stance, 'explanation': instance.explanation, 'author': str(instance.author.id)}
        return rep

    def create(self, validated_data):
        data = validated_data.pop('data', {}) 

        stance = data.get('stance', 'undefined') 
        explanation = data.get('explanation', '')
        connection = Connection.objects.create(
            author=self.context['request'].user,
            stance=stance,
            explanation=explanation,
            **validated_data
        )
        argument_map_id = self.context['argument_map_id']
        argument_map = ArgumentMap.objects.get(id=argument_map_id)

        create_log(
            user=self.context['request'].user,
            instance=connection,
            change_type="connection_created",
            description="Created a connection",
            argument_map=argument_map,
            data_before={},
            data_after=ConnectionSerializer(connection).data,
            group_id=self.context.get('action_group_id')
        )

        return connection

        
    def update(self, instance, validated_data):
        before = ConnectionSerializer(instance).data
        data = validated_data.get('data', {})
        instance.stance = data.get('stance', instance.stance)
        instance.explanation = data.get('explanation', instance.explanation)


        if 'source_argument' in validated_data:
            instance.source_argument = validated_data['source_argument']

        if 'target_argument' in validated_data:
            instance.target_argument = validated_data['target_argument']

        argument_map_id = self.context['argument_map_id']
        argument_map = ArgumentMap.objects.get(id=argument_map_id)

        instance.save()
        create_log(
            user=self.context['request'].user,
            instance=instance,
            argument_map=argument_map,
            change_type="connection_updated",
            description="Updated a connection",
            data_before=before,
            data_after=ConnectionSerializer(instance).data,
            group_id=self.context.get('action_group_id')
        )
        return instance


