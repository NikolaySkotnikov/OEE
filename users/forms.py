from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class LoginUserForm(AuthenticationForm):
    username = forms.CharField(label='Логин', widget=forms.TextInput(attrs={'class': 'form-control'}))
    password = forms.CharField(label='Пароль', widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    
    def clean(self):
        cleaned_data = super().clean()
        username = cleaned_data.get('username')
        password = cleaned_data.get('password')
        
        if username and password:
            user = User.objects.filter(username=username).first()
            if user and not user.groups.exists():
                raise ValidationError('У вас нет назначенной группы. Обратитесь к администратору.')
                
        return cleaned_data
    
    class Meta:
        model = User
        fields = ['username', 'password']
