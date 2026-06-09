namespace CliniqueLumiere.Api.Dtos;

/// <summary>Practitioner record returned by the API.</summary>
public class PractitionerResponse
{
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Specialty { get; set; } = string.Empty;
}
