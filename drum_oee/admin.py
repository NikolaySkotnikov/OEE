from django.contrib import admin
from .models import Status, Downtime, Cause
from api.models import CurrentProduction


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'description']
    list_display_links = ('name',)


@admin.register(Downtime)
class DowntimeAdmin(admin.ModelAdmin):
    list_display = ('status', 'order', 'start_time', 'end_time', 'quantity')
    list_filter = ('status', 'order')
    search_fields = ('order',)
    date_hierarchy = 'start_time'


@admin.register(Cause)
class CauseAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']

@admin.register(CurrentProduction)
class CurrentProductionAdmin(admin.ModelAdmin):
    list_display = ['id', 'current_order', 'current_type']