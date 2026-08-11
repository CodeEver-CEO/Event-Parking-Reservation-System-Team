using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Helpers;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Common;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations;

public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IBookingRepository _bookingRepository;

    public CustomerService(
        ICustomerRepository customerRepository,
        IBookingRepository bookingRepository)
    {
        _customerRepository = customerRepository;
        _bookingRepository = bookingRepository;
    }

    public async Task<ServiceResult<CustomerResponseDto>> GetByIdAsync(
        int customerId)
    {
        if (customerId <= 0)
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "Invalid customer ID.");
        }

        var customer =
           await _customerRepository.GetByIdAsync(customerId);

        if (customer is null)
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "Customer was not found.");
        }

        return ServiceResult<CustomerResponseDto>.Success(
            CustomerMapper.ToResponseDto(customer));
    }

    public async Task<ServiceResult<IReadOnlyList<CustomerResponseDto>>>
        SearchAsync(string? search)
    {
        var customers =
            await _customerRepository.SearchAsync(search);

        // Maps entities into safe DTOs before returning them to the controller.
        IReadOnlyList<CustomerResponseDto> response =
            customers
                .Select(CustomerMapper.ToResponseDto)
                .ToList();

        return ServiceResult<IReadOnlyList<CustomerResponseDto>>
            .Success(response);
    }

    public async Task<ServiceResult<CustomerResponseDto>> UpdateAsync(
        int customerId,
        UpdateCustomerDto request)
    {
        if (customerId <= 0)
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "Invalid customer ID.");
        }

        var customer =
            await _customerRepository.GetByIdForUpdateAsync(customerId);

        if (customer is null)
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "Customer was not found.");
        }

        customer.Name = request.Name.Trim();

        customer.Phone = string.IsNullOrWhiteSpace(request.Phone)
            ? null
            : request.Phone.Trim();

        // Records the last time the customer profile was modified.
        customer.UpdatedAt = DateTime.UtcNow;

        await _customerRepository.SaveChangesAsync();

        return ServiceResult<CustomerResponseDto>.Success(
            CustomerMapper.ToResponseDto(customer));
    }

    public async Task<ServiceResult<CustomerResponseDto>> ChangeStatusAsync(
        int customerId,
        bool activate)
    {
        if (customerId <= 0)
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "Invalid customer ID.");
        }

        var customer =
            await _customerRepository.GetByIdForUpdateAsync(customerId);

        if (customer is null)
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "Customer was not found.");
        }

        // BRD rule 14: a customer with active future bookings cannot be
        // deactivated until those bookings are cancelled or transferred.
        if (!activate &&
            await _bookingRepository.HasActiveFutureBookingsAsync(customerId))
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "This customer has active future bookings and cannot be " +
                "deactivated. Cancel or transfer those bookings first.");
        }

        // Uses soft deactivation instead of permanently deleting customer data.
        customer.Status = activate
            ? CustomerStatus.Active
            : CustomerStatus.Deactivated;

        customer.UpdatedAt = DateTime.UtcNow;

        await _customerRepository.SaveChangesAsync();

        return ServiceResult<CustomerResponseDto>.Success(
            CustomerMapper.ToResponseDto(customer));
    }
}
