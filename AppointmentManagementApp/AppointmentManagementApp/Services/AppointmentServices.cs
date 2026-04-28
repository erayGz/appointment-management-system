using AppointmentManagementApp.Data;
using AppointmentManagementApp.Dtos;
using AppointmentManagementApp.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentManagementApp.Services
{
    public class AppointmentService
    {
        private readonly AppDbContext _context;

        public AppointmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<AppointmentResponseDto>> GetAllAsync(DateTime? date)
        {
            var query = _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.ServiceItem)
                .AsQueryable();

            if (date.HasValue)
            {
                var day = date.Value.Date;
                query = query.Where(x => x.StartTime.Date == day);
            }

            return await query
                .OrderBy(x => x.StartTime)
                .Select(a => new AppointmentResponseDto
                {
                    Id = a.Id,
                    CustomerId = a.CustomerId,
                    CustomerName = a.Customer != null ? a.Customer.FullName : "",
                    ServiceItemId = a.ServiceItemId,
                    ServiceName = a.ServiceItem != null ? a.ServiceItem.Name : "",
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    Status = a.Status,
                    Notes = a.Notes
                })
                .ToListAsync();
        }

        public async Task<AppointmentResponseDto?> GetByIdAsync(int id)
        {
            var a = await _context.Appointments
                .Include(x => x.Customer)
                .Include(x => x.ServiceItem)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (a == null) return null;

            return new AppointmentResponseDto
            {
                Id = a.Id,
                CustomerId = a.CustomerId,
                CustomerName = a.Customer?.FullName ?? "",
                ServiceItemId = a.ServiceItemId,
                ServiceName = a.ServiceItem?.Name ?? "",
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                Status = a.Status,
                Notes = a.Notes
            };
        }

        public async Task<(AppointmentResponseDto? data, string? error)> CreateAsync(CreateAppointmentDto dto)
        {
            var customer = await _context.Customers.FindAsync(dto.CustomerId);
            if (customer == null) return (null, "Customer not found.");

            var service = await _context.Services.FindAsync(dto.ServiceItemId);
            if (service == null) return (null, "Service not found.");

            var endTime = dto.StartTime.AddMinutes(service.DurationMinutes);

            var hasConflict = await _context.Appointments.AnyAsync(a =>
                a.Status != AppointmentStatus.Cancelled &&
                dto.StartTime < a.EndTime &&
                endTime > a.StartTime);

            if (hasConflict) return (null, "Selected time slot is already booked.");

            var appointment = new Appointment
            {
                CustomerId = dto.CustomerId,
                ServiceItemId = dto.ServiceItemId,
                StartTime = dto.StartTime,
                EndTime = endTime,
                Status = AppointmentStatus.Pending,
                Notes = dto.Notes
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(appointment.Id), null);
        }
        public async Task<(AppointmentResponseDto? data, string? error)> UpdateAsync(int id, UpdateAppointmentDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return (null, "Appointment not found.");

            var customer = await _context.Customers.FindAsync(dto.CustomerId);
            if (customer == null) return (null, "Customer not found.");

            var service = await _context.Services.FindAsync(dto.ServiceItemId);
            if (service == null) return (null, "Service not found.");

            var endTime = dto.StartTime.AddMinutes(service.DurationMinutes);

            var hasConflict = await _context.Appointments.AnyAsync(a =>
                a.Id != id &&
                a.Status != AppointmentStatus.Cancelled &&
                dto.StartTime < a.EndTime &&
                endTime > a.StartTime);

            if (hasConflict) return (null, "Selected time slot is already booked.");

            appointment.CustomerId = dto.CustomerId;
            appointment.ServiceItemId = dto.ServiceItemId;
            appointment.StartTime = dto.StartTime;
            appointment.EndTime = endTime;
            appointment.Status = dto.Status;
            appointment.Notes = dto.Notes;

            await _context.SaveChangesAsync();

            return (await GetByIdAsync(id), null);
        }

        public async Task<(bool ok, string? error)> ChangeStatusAsync(int id, AppointmentStatus newStatus)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return (false, "Appointment not found.");

            appointment.Status = newStatus;
            await _context.SaveChangesAsync();

            return (true, null);
        }
    }
}