from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UsernameField

class CustomSignupForm(forms.ModelForm):
    password1 = forms.CharField(label="Parool", widget=forms.PasswordInput, required=True)
    password2 = forms.CharField(label="Kinnita parool", widget=forms.PasswordInput, required=True)
    email = forms.EmailField(label="E-post", required=True)

    class Meta:
        model = User
        fields = ("username", "email")  # Include email in the form
        field_classes = {"username": UsernameField}

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        email = cleaned_data.get("email")

        # Check if the passwords match
        if password1 and password2:
            if password1 != password2:
                self.add_error("password2", "Paroolid ei klapi!")

        # Check if the email is already in use
        if email and User.objects.filter(email=email).exists():
            self.add_error("email", "See e-post on juba kasutusel!")

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        user.email = self.cleaned_data["email"]  # Set the email
        if commit:
            user.save()
        return user
