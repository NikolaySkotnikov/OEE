from .forms import LoginUserForm
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.views import View


class UserLoginView(View):
    template_name = 'users/login.html'
    form_class = LoginUserForm
    
    def get(self, request):
        if request.user.is_authenticated:
            return self.handle_authenticated_user(request.user)
        form = self.form_class()
        return render(request, self.template_name, {'form': form})
    
    def post(self, request):
        form = self.form_class(data=request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(username=username, password=password)
            if user:
                login(request, user)
                return self.handle_authenticated_user(user)
            
        return render(request, self.template_name, {'form': form})
    
    def handle_authenticated_user(self, user):
        if user.groups.exists():
            group = user.groups.first().name
            if group == 'public':
                return redirect('public_dashboard')
            elif group == 'operator':
                return redirect('operator_dashboard')
            elif group == 'master':
                return redirect('master_dashboard')
        return redirect('login')
        

class UserLogoutView(View):
    def get(self, request):
        logout(request)
        return redirect('login')
