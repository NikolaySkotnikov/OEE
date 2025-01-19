from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Downtime
import threading
import time

@receiver(post_save, sender=Downtime)
def check_production_status(sender, instance, **kwargs):
    if instance.status_id == 2:
        thread = threading.Thread(target=check_quantity, args=(instance,))
        thread.start()

def check_quantity(instance):
    initial_quantity = instance.quantity
    time.sleep(60)
    
    latest_record = Downtime.objects.last()
    if latest_record.status_id != 2:
        return
        
    work_record = Downtime.objects.filter(status_id=2).latest('end_time')
    
    if work_record.quantity == initial_quantity:
        Downtime.objects.create(
            status_id=11,
            start_time=work_record.end_time,
            order=work_record.order,
            drum_type=work_record.drum_type
        )
