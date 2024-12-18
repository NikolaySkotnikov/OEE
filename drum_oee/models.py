from django.db import models
from django.utils import timezone


class Status(models.Model):
     
    name = models.ForeignKey('Cause', on_delete=models.CASCADE)
    description = models.CharField(blank=True, null=True, max_length=30)

    def __str__(self):
        return f"{self.name} - {self.description}"


class Cause(models.Model):

    name = models.CharField(blank=True, null=True, max_length=30)

    def __str__(self):
        return str(self.name)


class Downtime(models.Model):
    DRUM_TYPE_CHOICES = [
        ('closed', 'Закрытый верх'),
        ('open', 'Открытый верх'),
    ]

    status = models.ForeignKey('Status', on_delete=models.CASCADE, verbose_name='Статус')
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='Дата начала')
    order = models.CharField(blank=True, null=True, max_length=20, verbose_name='Заказ')
    quantity = models.IntegerField(default=0, verbose_name='Количество')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='Дата завершения')
    drum_type = models.CharField(
        max_length=6,
        choices=DRUM_TYPE_CHOICES,
        null=True,
        blank=True,
        verbose_name='Тип бочки'
    )

    def save(self, *args, **kwargs):   
        if self.start_time is None:
            self.start_time = timezone.now()

        if Downtime.objects.exists():
            last_record = Downtime.objects.order_by('-id')[0]
            if last_record.end_time is None:
                Downtime.objects.filter(id=last_record.id).update(end_time=self.start_time)
        super().save(*args, **kwargs)

    @property
    def drum_type_display(self):
        return dict(self.DRUM_TYPE_CHOICES).get(self.drum_type, '')

    def to_dict(self):
        return {
            'id': self.id,
            'status': self.status.name.name,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'order': self.order,
            'quantity': self.quantity,
            'drum_type': self.drum_type_display
        }
