from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import Status


@login_required
def public_dashboard(request):
    return render(request, 'drum_oee/public_dashboard.html', {'title': 'Панель пользователя'})

@login_required
def operator_dashboard(request):
    changeover = Status.objects.filter(name__name='Переналадка')
    nonproduction = Status.objects.filter(name__name='Непроизводственное время')
    breaking = Status.objects.filter(name__name='Поломка')
    consistent = Status.objects.filter(name__name='Согласованный простой')
    
    context = {
        'title': 'Панель оператора',
        'changeover': changeover,
        'nonproduction': nonproduction,
        'breaking': breaking,
        'consistent': consistent,
    }
    return render(request, 'drum_oee/operator_dashboard.html', context)


@login_required
def master_dashboard(request):
    return render(request, 'drum_oee/master_dashboard.html', {'title': 'Панель мастера'})
