from rest_framework import serializers
from ..models import Argument, ArgumentMap, Operator, Connection, Operator
from ..utils.create_log import create_log
from rest_framework.exceptions import ValidationError

class ArgumentSerializer(serializers.ModelSerializer):
    data = serializers.JSONField(write_only=True)

    class Meta:
        model = Argument
        fields = ['id', 'data']


    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(instance.id)
        data['data'] = {'content': instance.content, 'is_root': instance.is_root}
        return data

    def create(self, validated_data):
        data_field = self.initial_data.get('data', {})

        argument = Argument.objects.create(
            author=self.context['request'].user,
            content=data_field.get('content'),
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
        data_field = self.initial_data.get('data', {})

        instance.content = data_field.get('content', instance.content)

        argument_map_id = self.context['argument_map_id']
        argument_map = ArgumentMap.objects.get(id=argument_map_id)
        
        if argument_map.author is not self.context['request'].user:
            argument_map.contributors.add(self.context['request'].user)

        
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
    source = serializers.PrimaryKeyRelatedField(source='source_argument', queryset=Argument.objects.all())
    target = serializers.PrimaryKeyRelatedField(source='target_operator', queryset=Operator.objects.all())
    data = serializers.JSONField(write_only=True)
    
    class Meta:
        model = Connection
        fields = ['id', 'source', 'target', 'data']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['id'] = str(rep['id'])
        rep['source'] = str(instance.source_argument.id)
        rep['target'] = str(instance.target_operator.id)
        rep['data'] = {'stance': instance.stance, 'explanation': instance.explanation, 'author': str(instance.author.id)}
        return rep

    def create(self, validated_data):
        data = validated_data.pop('data', {}) 
        print("vallidated",validated_data)
        argument_map_id = self.context['argument_map_id']
        argument_map = ArgumentMap.objects.get(id=argument_map_id)

        if argument_map.author is not self.context['request'].user:
            argument_map.contributors.add(self.context['request'].user)

        
        stance = data.get('stance', 'undefined') 
        explanation = data.get('explanation', '')
        connection = Connection.objects.create(
            author=self.context['request'].user,
            stance=stance,
            explanation=explanation,
            argument_map = argument_map,
            **validated_data
        )
        

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

        if 'target_operator' in validated_data:
            instance.target_operator = validated_data['target_operator']


        argument_map_id = self.context['argument_map_id']
        argument_map = ArgumentMap.objects.get(id=argument_map_id)
        
        if argument_map.author is not self.context['request'].user:
            argument_map.contributors.add(self.context['request'].user)


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



class OperatorSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField()

    class Meta:
        model = Operator
        fields = ['id', 'data']

    def get_data(self, obj):
        return {
            "argument_ids": list(obj.arguments.values_list('id', flat=True)),
            "operator_type": obj.operator_type
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['id'] = str(instance.id)
        ret['data'] = {
            "argument_map": str(instance.argument_map.id) if instance.argument_map else None,
            "argument_ids": [str(id) for id in instance.arguments.values_list('id', flat=True)],
            "operator_type": instance.operator_type
        }
        return ret

    def create(self, validated_data):
        request_data = self.initial_data.get('data', {})
        argument_ids = request_data.get('argument_ids', [])
        operator_type = request_data.get('operator_type', 'AND')

        operator = Operator.objects.create(
            argument_map=ArgumentMap.objects.get(id=self.context['argument_map_id']), 
            operator_type=operator_type,
        )
        if argument_ids:
            arguments = Argument.objects.filter(id__in=argument_ids)
            operator.arguments.set(arguments)

        return operator

    def update(self, instance, validated_data):
        request_data = self.initial_data.get('data', {})
        argument_ids = request_data.get('argument_ids')
        argument_map_id = self.context['argument_map_id']
        argument_map = ArgumentMap.objects.get(id=argument_map_id)
        
        if argument_map.author is not self.context['request'].user:
            argument_map.contributors.add(self.context['request'].user)


        arguments = Argument.objects.filter(id__in=argument_ids)
        instance.arguments.set(arguments)

        instance.auto_set_type()  
        instance.save()
        return instance

