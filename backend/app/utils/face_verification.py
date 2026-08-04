import asyncio
from typing import List, Optional

import boto3
import httpx

from app.core import settings
from app.core.logger import logger

# AWS Rekognition similarity is a 0–100 confidence score.
# 80.0 is a standard threshold for face verification.
REKOGNITION_SIMILARITY_THRESHOLD = 80.0

TIMEOUT = httpx.Timeout(
    connect=10.0,
    read=10.0,
    write=10.0,
    pool=10.0,
)

LIMITS = httpx.Limits(
    max_connections=10,
    max_keepalive_connections=5,
)

SEM = asyncio.Semaphore(5)


def get_rekognition_client():
    return boto3.client(
        "rekognition",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def detect_face(image_bytes: bytes) -> bool:
    """
    Return True if AWS Rekognition detects at least one face in the image.
    Used to validate the uploaded image before running comparisons.
    """
    try:
        client = get_rekognition_client()
        response = client.detect_faces(Image={"Bytes": image_bytes})
        return len(response.get("FaceDetails", [])) > 0
    except Exception as e:
        logger.error(f"Rekognition detect_faces error: {e}")
        return False


def compare_faces(source_bytes: bytes, target_bytes: bytes) -> Optional[float]:
    """
    Compare two face images using AWS Rekognition.
    Returns the similarity score (0–100) if faces are detected, otherwise None.
    """
    try:
        client = get_rekognition_client()
        response = client.compare_faces(
            SourceImage={"Bytes": source_bytes},
            TargetImage={"Bytes": target_bytes},
            SimilarityThreshold=REKOGNITION_SIMILARITY_THRESHOLD,
        )
        matches = response.get("FaceMatches", [])
        if not matches:
            return None
        return matches[0]["Similarity"]
    except Exception as e:
        logger.error(f"Rekognition error: {e}")
        return None


async def fetch_image(client: httpx.AsyncClient, url: str) -> Optional[bytes]:
    """Fetch image bytes from a URL with concurrency control."""
    async with SEM:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.content
        except (
            httpx.ReadError,
            httpx.ConnectError,
            httpx.TimeoutException,
            httpx.RemoteProtocolError,
            httpx.HTTPStatusError,
            asyncio.CancelledError,
        ):
            return None


async def verify_face(
    uploaded_image_bytes: bytes,
    stored_image_urls: List[str],
) -> bool:
    """
    Return True if the uploaded face matches the minimum number
    of stored profile images defined in settings.
    """
    if not stored_image_urls:
        return False

    if len(stored_image_urls) < settings.FACE_MIN_MATCHES:
        return False

    if not await asyncio.to_thread(detect_face, uploaded_image_bytes):
        raise ValueError(
            "No face detected in the uploaded image. Please upload a clear photo of your face."
        )

    min_matches = settings.FACE_MIN_MATCHES
    match_count = 0

    async with httpx.AsyncClient(
        timeout=TIMEOUT,
        limits=LIMITS,
        follow_redirects=True,
    ) as client:

        tasks = [
            asyncio.create_task(fetch_image(client, url)) for url in stored_image_urls
        ]

        try:
            for task in asyncio.as_completed(tasks):
                img_bytes = await task
                if not img_bytes:
                    continue

                similarity = await asyncio.to_thread(
                    compare_faces, uploaded_image_bytes, img_bytes
                )

                if similarity is not None:
                    match_count += 1

                    if match_count >= min_matches:
                        for t in tasks:
                            t.cancel()
                        return True

        finally:
            for t in tasks:
                t.cancel()

    return False
