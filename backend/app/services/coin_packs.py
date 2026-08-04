from app.core.config import settings
from app.domain.coin_pack import CoinPack


def get_coin_pack(product_id: str) -> CoinPack:
    """Retrieves a CoinPack by its product_id."""
    try:
        data = settings.COIN_PACKS[product_id]
    except KeyError:
        raise ValueError(f"Unknown product_id: {product_id}")

    return CoinPack(
        product_id=product_id,
        amount=data["amount"],
    )
