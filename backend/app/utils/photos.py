from app.models.profile import Profile


def get_best_photo(profile: Profile) -> str:
    if not profile or not profile.photos:
        return ""
    photo = next((p for p in profile.photos if p.is_primary), profile.photos[0])
    return photo.url
