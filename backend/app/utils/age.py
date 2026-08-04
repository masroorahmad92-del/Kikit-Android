from datetime import date, datetime


def calculate_age(dob_str: str | None) -> int | None:
    """
    Calculate age from DOB string.
    Expected formats: DD-MM-YYYY or DD/MM/YYYY.
    Returns None if dob is missing or invalid.
    """

    if not dob_str:
        return None

    # Normalize delimiters
    dob_str = dob_str.replace("/", "-")

    try:
        dob = datetime.strptime(dob_str, "%d-%m-%Y").date()
    except ValueError:
        return None  # Invalid format

    today = date.today()

    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    return age
