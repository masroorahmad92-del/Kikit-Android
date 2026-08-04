from dataclasses import dataclass


@dataclass(frozen=True)
class CoinPack:
    product_id: str
    amount: int
