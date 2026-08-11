namespace EventParkingReservationSystem.API.Services.Common;

public sealed class ServiceResult<T>
{
    public bool Succeeded { get; init; }

    public T? Data { get; init; }

    public string? Error { get; init; }

    // Creates a successful service response with data.
    public static ServiceResult<T> Success(T data)
    {
        return new ServiceResult<T>
        {
            Succeeded = true,
            Data = data
        };
    }

    // Creates a failed service response with a safe error message.
    public static ServiceResult<T> Failure(string error)
    {
        return new ServiceResult<T>
        {
            Succeeded = false,
            Error = error
        };
    }
}