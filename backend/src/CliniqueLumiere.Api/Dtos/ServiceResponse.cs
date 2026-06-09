namespace CliniqueLumiere.Api.Dtos;

/// <summary>Service record returned by the API.</summary>
public class ServiceResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int DurationMinutes { get; set; }

    public decimal Price { get; set; }
}
