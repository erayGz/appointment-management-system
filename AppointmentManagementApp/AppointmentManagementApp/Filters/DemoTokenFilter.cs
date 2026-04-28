using AppointmentManagementApp.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AppointmentManagementApp.Filters
{
    public class DemoTokenFilter : IAsyncActionFilter
    {
        private readonly DemoAuthService _authService;

        public DemoTokenFilter(DemoAuthService authService)
        {
            _authService = authService;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (!context.HttpContext.Request.Headers.TryGetValue("X-Demo-Token", out var tokenValue))
            {
                context.Result = new UnauthorizedObjectResult(new { message = "Missing X-Demo-Token header." });
                return;
            }

            var token = tokenValue.ToString();

            if (!_authService.IsValidToken(token))
            {
                context.Result = new UnauthorizedObjectResult(new { message = "Invalid token." });
                return;
            }

            await next();
        }
    }
}