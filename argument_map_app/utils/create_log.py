from django.contrib.contenttypes.models import ContentType
from ..models import Log


def create_log(user, instance, change_type, description, data_before=None, data_after=None, group_id=None, argument_map=None):
    # instance.argument_map if hasattr(instance, 'argument_map') else None,
    return Log.objects.create(
        user=user,
        argument_map=argument_map,
        content_type=ContentType.objects.get_for_model(instance),
        object_id=instance.id,
        change_type=change_type,
        change_description=description,
        data_before=data_before,
        data_after=data_after,
        action_group_id=group_id
    )

