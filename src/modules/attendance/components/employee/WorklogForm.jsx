import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import { employeeAPI } from '../../api/employee';
import Card from '../ui/Card';
import Button from '../ui/Button';
import 'react-datepicker/dist/react-datepicker.css';

const worklogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  fromTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  toTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  activity: z.string().min(5, 'Activity description must be at least 5 characters'),
  customerName: z.string().optional(),
  ticketId: z.string().optional(),
});

// Generate time options in 15-minute intervals from 00:00 to 23:45
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      times.push(`${h}:${m}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

const WorklogForm = ({ onWorklogCreated }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(worklogSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      fromTime: '',
      toTime: '',
      activity: '',
      customerName: '',
      ticketId: '',
    },
  });

  const fromTime = watch('fromTime');

  const onSubmit = async (data) => {
    // Validate time range
    const [fromHours, fromMinutes] = data.fromTime.split(':').map(Number);
    const [toHours, toMinutes] = data.toTime.split(':').map(Number);
    const fromTotalMinutes = fromHours * 60 + fromMinutes;
    const toTotalMinutes = toHours * 60 + toMinutes;

    if (toTotalMinutes <= fromTotalMinutes) {
      toast.error('End time must be after start time');
      return;
    }

    setIsLoading(true);
    try {
      const response = await employeeAPI.createWorklog(data);
      toast.success(response.message || 'Worklog created successfully!');
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        fromTime: '',
        toTime: '',
        activity: '',
        customerName: '',
        ticketId: '',
      });
      setSelectedDate(new Date());
      if (onWorklogCreated) {
        onWorklogCreated();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create worklog';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const formattedDate = format(date, 'yyyy-MM-dd');
    reset({ ...watch(), date: formattedDate });
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Add Worklog</h2>
          <p className="text-sm text-dark-600">Track your daily activities and work hours</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Date Picker */}
        <div>
          <label className="label-premium">Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="yyyy-MM-dd"
              className="input-premium pl-10 w-full"
              maxDate={new Date()}
            />
          </div>
          <input type="hidden" {...register('date')} />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600 font-medium">{errors.date.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* From Time */}
          <div>
            <label className="label-premium">From Time</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <select
                {...register('fromTime')}
                className="input-premium pl-10"
              >
                <option value="">Start time</option>
                {timeOptions.map((time) => (
                  <option key={`from-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            {errors.fromTime && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.fromTime.message}</p>
            )}
          </div>

          {/* To Time */}
          <div>
            <label className="label-premium">To Time</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <select
                {...register('toTime')}
                className="input-premium pl-10"
              >
                <option value="">End time</option>
                {timeOptions.map((time) => (
                  <option key={`to-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            {errors.toTime && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.toTime.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Name */}
          <div>
            <label className="label-premium">Customer Name <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input
              type="text"
              {...register('customerName')}
              placeholder="e.g. Acme Corp"
              className="input-premium w-full"
            />
          </div>

          {/* Ticket ID */}
          <div>
            <label className="label-premium">Ticket ID <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input
              type="text"
              {...register('ticketId')}
              placeholder="e.g. TKT-1234"
              className="input-premium w-full"
            />
          </div>
        </div>

        {/* Activity Description */}
        <div>
          <label className="label-premium">Activity Description</label>
          <div className="relative">
             {/* Textarea doesn't easily support absolute icon inside at top-left without padding adjustment, 
                 but let's just make it premium without icon inside, or icon outside */}
            <textarea
              {...register('activity')}
              rows={4}
              className="input-premium resize-none"
              placeholder="Describe what you worked on..."
            />
          </div>
          {errors.activity && (
            <p className="mt-1 text-sm text-red-600 font-medium">{errors.activity.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Creating Worklog...' : 'Add Worklog'}
        </Button>
      </form>
    </Card>
  );
};

export default WorklogForm;
