using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Services.Common;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface ICustomerService
{
    Task<ServiceResult<CustomerResponseDto>> GetByIdAsync(int customerId);

    Task<ServiceResult<IReadOnlyList<CustomerResponseDto>>> SearchAsync(
        string? search);

    Task<ServiceResult<CustomerResponseDto>> UpdateAsync(
        int customerId,
        UpdateCustomerDto request);

    Task<ServiceResult<CustomerResponseDto>> ChangeStatusAsync(
        int customerId,
        bool activate);
}
