from django.db import models


class CurrentProduction(models.Model):
    current_order = models.CharField(max_length=100, null=True, blank=True)
    current_type = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"Order: {self.current_order}, Type: {self.current_type}"
