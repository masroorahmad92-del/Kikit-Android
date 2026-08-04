from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class SparkCreate(BaseModel):
    spark_interest_id: UUID | None = None
    spark_category_id: UUID | None = None
    spark_question: str | None = Field(default=None, max_length=255)
    spark_answer: str = Field(..., max_length=280)
    spark_created_from: str = Field(default="discover", max_length=50)

    @field_validator("spark_answer", "spark_question", "spark_created_from", mode="before")
    @classmethod
    def trim_text(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("spark_answer")
    @classmethod
    def require_answer(cls, value: str) -> str:
        if not value:
            raise ValueError("Spark answer is required")
        return value

    @field_validator("spark_created_from")
    @classmethod
    def require_source(cls, value: str) -> str:
        return value or "discover"
