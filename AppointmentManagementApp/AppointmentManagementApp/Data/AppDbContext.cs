using AppointmentManagementApp.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentManagementApp.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<ServiceItem> Services => Set<ServiceItem>();
        public DbSet<Appointment> Appointments => Set<Appointment>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ServiceItem>().Property(x => x.Price).HasPrecision(18, 2);

            modelBuilder.Entity<ServiceItem>().HasData(
                new ServiceItem { Id = 1, Name = "Haircut", DurationMinutes = 45, Price = 20 },
                new ServiceItem { Id = 2, Name = "Beard Trim", DurationMinutes = 20, Price = 10 },
                new ServiceItem { Id = 3, Name = "Hair + Beard", DurationMinutes = 60, Price = 28 }
            );
        }
    }
}