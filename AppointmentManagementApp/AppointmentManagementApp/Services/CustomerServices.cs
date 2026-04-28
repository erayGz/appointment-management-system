using AppointmentManagementApp.Data;
using AppointmentManagementApp.Dtos;
using AppointmentManagementApp.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentManagementApp.Services
{
    public class CustomerService
    {
        private readonly AppDbContext _context;

        public CustomerService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Customer>> GetAllAsync(string? search)
        {
            var query = _context.Customers.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x =>
                    x.FullName.Contains(search) ||
                    x.Phone.Contains(search) ||
                    x.Email.Contains(search));
            }

            return await query.OrderBy(x => x.FullName).ToListAsync();
        }

        public async Task<Customer?> GetByIdAsync(int id)
        {
            return await _context.Customers.FindAsync(id);
        }

        public async Task<Customer> CreateAsync(CreateCustomerDto dto)
        {
            var customer = new Customer
            {
                FullName = dto.FullName.Trim(),
                Phone = dto.Phone.Trim(),
                Email = dto.Email.Trim()
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return customer;
        }

        public async Task<bool> UpdateAsync(int id, UpdateCustomerDto dto)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return false;

            customer.FullName = dto.FullName.Trim();
            customer.Phone = dto.Phone.Trim();
            customer.Email = dto.Email.Trim();

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool ok, string? error)> DeleteAsync(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
                return (false, "Customer not found.");

            var hasFutureAppointments = await _context.Appointments.AnyAsync(a =>
                a.CustomerId == id &&
                a.Status != AppointmentStatus.Cancelled &&
                a.StartTime >= DateTime.Now);

            if (hasFutureAppointments)
                return (false, "Customer has active/future appointments.");

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return (true, null);
        }
    }
}