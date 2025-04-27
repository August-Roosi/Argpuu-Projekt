from ..models import Argument, ArgumentMap, Connection
from django.contrib.auth.models import User


def deserialize_connection_data(instance, log) -> dict:
    deserialized_data = {}

    if instance:
        # MODIFY the instance
        if isinstance(instance, Connection):
            for key, value in log.data_before.items():
                if key == "source":
                    setattr(instance, "source_argument", Argument.objects.get(id=value))
                elif key == "target":
                    setattr(instance, "target_argument", Argument.objects.get(id=value))

                elif key == "argument_map":
                    setattr(instance, "argument_map", ArgumentMap.objects.get(id=value))
                elif key == "data" and isinstance(value, dict):
                    for data_key, data_value in value.items():
                        if data_key == "author":
                            setattr(instance, data_key, User.objects.get(id=data_value))
                        else:
                            setattr(instance, data_key, data_value)
                else:
                    setattr(instance, key, value)

        elif isinstance(instance, Argument):
            for key, value in log.data_before.items():
                if key == "argument_map":
                    setattr(instance, "argument_map", ArgumentMap.objects.get(id=value))
                elif key == "data" and isinstance(value, dict):
                    for data_key, data_value in value.items():
                        if data_key == "author":
                            setattr(instance, data_key, User.objects.get(id=data_value))
                        else:
                            setattr(instance, data_key, data_value)
                else:
                    setattr(instance, key, value)

        instance.save()
        return instance
    else:
        # BUILD a new deserialized dictionary
        if log.content_type.model_class() == Connection:
            print("heei",log.data_before)
            for key, value in log.data_before.items():
                if key == "id":
                    deserialized_data["id"] = str(value)
                elif key == "source":
                    deserialized_data["source_argument"] = Argument.objects.get(id=value)
                elif key == "target":
                    deserialized_data["target_argument"] = Argument.objects.get(id=value)
                elif key == "argument_map":
                    deserialized_data["argument_map"] = ArgumentMap.objects.get(id=value)
                elif key == "data" and isinstance(value, dict):
                    for data_key, data_value in value.items():
                        if data_key == "stance":
                            deserialized_data["stance"] = data_value
                        elif data_key == "author":
                            deserialized_data["author"] = User.objects.get(id=data_value)
                        elif data_key == "explanation":
                            deserialized_data["explanation"] = data_value
                        else:
                            deserialized_data[data_key] = data_value
                else:
                    deserialized_data[key] = value

        elif log.content_type.model_class() == Argument:
            for key, value in log.data_before.items():
                if key == "argument_map":
                    deserialized_data["argument_map"] = ArgumentMap.objects.get(id=value)
                elif key == "author":
                    deserialized_data["author"] = User.objects.get(id=value)
                elif key == "data" and isinstance(value, dict):
                    for data_key, data_value in value.items():
                        if data_key == "author":
                            deserialized_data["author"] = User.objects.get(id=data_value)
                        else:
                            deserialized_data[data_key] = data_value
                    
                else:
                    deserialized_data[key] = value
        
        return deserialized_data