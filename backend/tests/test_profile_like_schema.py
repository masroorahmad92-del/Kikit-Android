import unittest
from uuid import uuid4

from pydantic import ValidationError

from app.schemas.profile_like import SparkCreate


class SparkCreateSchemaTest(unittest.TestCase):
    def test_spark_answer_is_trimmed(self):
        payload = SparkCreate(
            spark_interest_id=uuid4(),
            spark_answer="  Coffee before a morning walk.  ",
        )

        self.assertEqual(payload.spark_answer, "Coffee before a morning walk.")
        self.assertEqual(payload.spark_created_from, "discover")

    def test_empty_spark_answer_is_rejected(self):
        with self.assertRaises(ValidationError):
            SparkCreate(spark_answer="   ")

    def test_long_spark_answer_is_rejected(self):
        with self.assertRaises(ValidationError):
            SparkCreate(spark_answer="x" * 281)


if __name__ == "__main__":
    unittest.main()
