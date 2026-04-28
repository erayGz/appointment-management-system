using Microsoft.AspNetCore.Mvc;
using AppointmentManagementApp.Dtos;
using AppointmentManagementApp.Services;

namespace Acms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly DemoAuthService _authService;

    public AuthController(DemoAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public ActionResult<LoginResponseDto> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var result = _authService.Login(dto);

        if (result is null)
            return Unauthorized(new { message = "Invalid username or password." });

        return Ok(result);
    }
}