using AppointmentManagementApp.Dtos;

namespace AppointmentManagementApp.Services
{
    public class DemoAuthService
    {
        public LoginResponseDto? Login(LoginRequestDto dto)
        {
            if (dto.Username == "admin" && dto.Password == "12345")
            {
                return new LoginResponseDto
                {
                    Token = Guid.NewGuid().ToString("N"),
                    Username = "admin",
                    Role = "Admin"
                };
            }

            if (dto.Username == "staff" && dto.Password == "12345")
            {
                return new LoginResponseDto
                {
                    Token = Guid.NewGuid().ToString("N"),
                    Username = "staff",
                    Role = "Staff"
                };
            }

            return null;
        }

        public bool IsValidToken(string token)
        {
            return !string.IsNullOrWhiteSpace(token);
        }
    }
}