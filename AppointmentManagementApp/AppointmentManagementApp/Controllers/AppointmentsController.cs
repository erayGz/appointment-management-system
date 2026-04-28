using AppointmentManagementApp.Dtos;
using AppointmentManagementApp.Filters;
using AppointmentManagementApp.Models;
using AppointmentManagementApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppointmentManagementApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ServiceFilter(typeof(DemoTokenFilter))]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppointmentService _appointmentService;

        public AppointmentsController(AppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? date)
        {
            return Ok(await _appointmentService.GetAllAsync(date));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var appointment = await _appointmentService.GetByIdAsync(id);
            return appointment is null ? NotFound() : Ok(appointment);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentDto dto)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var (data, error) = await _appointmentService.CreateAsync(dto);

            if (data is null)
                return BadRequest(new { message = error });

            return CreatedAtAction(nameof(GetById), new { id = data.Id }, data);
        }
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAppointmentDto dto)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var (data, error) = await _appointmentService.UpdateAsync(id, dto);

            if (data is null)
                return BadRequest(new { message = error });

            return Ok(data);
        }

        [HttpPost("{id:int}/confirm")]
        public async Task<IActionResult> Confirm(int id)
        {
            var (ok, error) = await _appointmentService.ChangeStatusAsync(id, AppointmentStatus.Confirmed);

            if (!ok)
                return NotFound(new { message = error });

            return Ok(new { message = "Appointment confirmed." });
        }

        [HttpPost("{id:int}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var (ok, error) = await _appointmentService.ChangeStatusAsync(id, AppointmentStatus.Cancelled);

            if (!ok)
                return NotFound(new { message = error });

            return Ok(new { message = "Appointment cancelled." });
        }

        [HttpPost("{id:int}/complete")]
        public async Task<IActionResult> Complete(int id)
        {
            var (ok, error) = await _appointmentService.ChangeStatusAsync(id, AppointmentStatus.Completed);

            if (!ok)
                return NotFound(new { message = error });

            return Ok(new { message = "Appointment completed." });
        }
    }
}