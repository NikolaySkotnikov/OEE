from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from drum_oee.models import Downtime, Status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q
from datetime import datetime, timedelta
from django.utils import timezone
from api.models import CurrentProduction


class ParametrsView(APIView):
    def post(self, request):
        current_production = CurrentProduction.objects.get(id=1)

        print(request.data)
        order_number = request.data.get('order_number')
        drum_type = request.data.get('drum_type')
        status_downtime = request.data.get('status')

        if not status_downtime and order_number and drum_type:
            current_production.current_order = order_number
            current_production.current_type = drum_type
            current_production.save()

            print(current_production.current_order, current_production.current_type)

        else:

            if Status.objects.get(id=status_downtime).name_id == 1:
                current_production.current_order = None
                current_production.current_type = None
                current_production.save()

                if not Downtime.objects.last():
                    start = timezone.now()
                else:
                    start = Downtime.objects.last().end_time
                status_downtime = Status.objects.get(id=status_downtime)

                Downtime.objects.create(
                    status=status_downtime,
                    start_time=start,
                )
                return Response(status=status.HTTP_200_OK)
            
            elif Status.objects.get(id=status_downtime).name_id == 3:

                if order_number != '':
                    current_production.current_order = order_number
                if drum_type != '':
                    current_production.current_type = drum_type
                current_production.save()

                status_downtime = Status.objects.get(id=status_downtime)
                Downtime.objects.create(
                    order=current_production.current_order,
                    status=status_downtime,
                    drum_type=current_production.current_type,
                    start_time = Downtime.objects.last().end_time
                )
                return Response(status=status.HTTP_200_OK)
            
            elif Status.objects.get(id=status_downtime).name_id in [4, 5]:
                status_downtime = Status.objects.get(id=status_downtime)
                Downtime.objects.create(
                    order=current_production.current_order,
                    status=status_downtime,
                    drum_type=current_production.current_type,
                    start_time=Downtime.objects.last().end_time,
                )
                return Response(status=status.HTTP_200_OK)

        return Response(status=status.HTTP_200_OK)

    def get(self, request):
        try:
            if Downtime.objects.last().status_id == 1:
                return Response([])
            else:
                latest_downtime = Downtime.objects.latest('start_time')
                last_order = latest_downtime.order
                
                downtimes = [downtime.to_dict() for downtime in Downtime.objects.filter(order=last_order)]
            
            return Response(downtimes)
        except Downtime.DoesNotExist:
            return Response([])
        
        
@method_decorator(csrf_exempt, name='dispatch')
class DrumCounterView(APIView):
    def post(self, request):
        current_production = CurrentProduction.objects.get(id=1)
        current_order = current_production.current_order
        current_type = current_production.current_type
        
        downtime = Downtime.objects.filter(order=current_order).last()
        
        if not downtime or Downtime.objects.last().status_id != 2:
            work_type = Status.objects.get(id=2)
            downtime = Downtime.objects.create(
                order=current_order,
                status=work_type,
                start_time=timezone.now(),
                end_time=timezone.now(),
                quantity=1,
                drum_type=current_type,
            )
        else:
            downtime.quantity += 1
            downtime.end_time = timezone.now()
            downtime.save()
        
        return Response(status=status.HTTP_200_OK)


class DowntimeFilterView(APIView):
    def get(self, request):
        quick_period = request.GET.get('quick_period')
        start_date = request.GET.get('start_date')
        start_time = request.GET.get('start_time')
        end_date = request.GET.get('end_date')
        end_time = request.GET.get('end_time')

        queryset = Downtime.objects.all()

        if quick_period:
            today = timezone.now().date()
            shift_start_time = datetime.strptime("07:30", "%H:%M").time()

            if quick_period == 'today':
                start_datetime = timezone.make_aware(datetime.combine(today, shift_start_time))
                end_datetime = timezone.now()
            elif quick_period == 'yesterday':
                yesterday = today - timedelta(days=1)
                start_datetime = timezone.make_aware(datetime.combine(yesterday, shift_start_time))
                end_datetime = timezone.make_aware(datetime.combine(today, shift_start_time))
        else:
            if start_date and start_time and end_date and end_time:
                start_datetime = timezone.make_aware(datetime.strptime(f"{start_date} {start_time}", "%Y-%m-%d %H:%M"))
                end_datetime = timezone.make_aware(datetime.strptime(f"{end_date} {end_time}", "%Y-%m-%d %H:%M"))
            else:
                return Response([])

        queryset = queryset.filter(
            Q(start_time__gte=start_datetime) & 
            Q(start_time__lte=end_datetime) |
            Q(end_time__gte=start_datetime) & 
            Q(end_time__lte=end_datetime)
        ).order_by('start_time')

        if not queryset.exists():
            return Response([])

        queryset_response = [downtime.to_dict() for downtime in queryset]

        if queryset_response and queryset_response[-1]['status'] != 'В работе':
                queryset_response[-1]['end_time'] = timezone.now()

        if queryset_response:

            if queryset_response[0]['status'] == 'Непроизводственное время':
                first_start = queryset_response[0]['start_time']
                first_end = queryset_response[0]['end_time']
                
                if first_start and first_end:
                    if isinstance(first_start, str):
                        first_start = datetime.strptime(first_start, "%Y-%m-%dT%H:%M:%S.%fZ")
                    if isinstance(first_end, str):
                        first_end = datetime.strptime(first_end, "%Y-%m-%dT%H:%M:%S.%fZ")
                    
                    if (first_end - first_start) > timedelta(minutes=15):
                        queryset_response[0]['start_time'] = (first_end - timedelta(minutes=15)).isoformat()

            if queryset_response[-1]['status'] == 'Непроизводственное время':
                last_start = queryset_response[-1]['start_time']
                last_end = queryset_response[-1]['end_time']
                
                if last_start and last_end:
                    if isinstance(last_start, str):
                        last_start = datetime.strptime(last_start, "%Y-%m-%dT%H:%M:%S.%fZ")
                    if isinstance(last_end, str):
                        last_end = datetime.strptime(last_end, "%Y-%m-%dT%H:%M:%S.%fZ")
                    
                    if (last_end - last_start) > timedelta(minutes=15):
                        queryset_response[-1]['end_time'] = (last_start + timedelta(minutes=15)).isoformat()
                

        return Response(queryset_response)
