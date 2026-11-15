"""Serve uploaded media with HTTP Range support (development only).

django.views.static.serve always answers 200 with the whole file, so the browser
cannot seek inside a video. This view answers byte ranges with 206 instead.
"""
import mimetypes
import os
import re

from django.conf import settings
from django.core.exceptions import SuspiciousFileOperation
from django.http import Http404, HttpResponse, StreamingHttpResponse
from django.utils._os import safe_join
from django.utils.http import http_date
from django.views.decorators.http import require_safe

CHUNK_SIZE = 64 * 1024  # the file is sent in pieces, never read into memory whole

# bytes=start-end | bytes=start- | bytes=-N
RANGE_RE = re.compile(r"^bytes=(\d*)-(\d*)$")


class InvalidRange(Exception):
    pass


def parse_range(header, size):
    """Return (start, end) with both ends included, or raise InvalidRange."""
    match = RANGE_RE.match(header.strip())
    if not match:
        raise InvalidRange
    first, last = match.groups()

    if first == "":
        # Suffix range: the last N bytes
        if last == "" or int(last) == 0 or size == 0:
            raise InvalidRange
        length = min(int(last), size)
        return size - length, size - 1

    start = int(first)
    end = int(last) if last != "" else size - 1
    if start >= size or end < start:
        raise InvalidRange
    return start, min(end, size - 1)


def file_chunks(path, start, length):
    with open(path, "rb") as source:
        source.seek(start)
        remaining = length
        while remaining > 0:
            chunk = source.read(min(CHUNK_SIZE, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


@require_safe
def serve_media(request, path):
    try:
        full_path = safe_join(settings.MEDIA_ROOT, path)  # blocks ../ tricks
    except SuspiciousFileOperation:
        raise Http404("File not found")
    if not os.path.isfile(full_path):
        raise Http404("File not found")

    size = os.path.getsize(full_path)
    content_type = mimetypes.guess_type(full_path)[0] or "application/octet-stream"
    range_header = request.headers.get("Range", "")

    status = 200
    start, end = 0, size - 1
    # Only the bytes unit is understood; a multi-range request gets the whole file (allowed by HTTP).
    if range_header.startswith("bytes=") and "," not in range_header:
        try:
            start, end = parse_range(range_header, size)
            status = 206
        except InvalidRange:
            response = HttpResponse(status=416)
            response["Content-Range"] = "bytes */%d" % size
            response["Accept-Ranges"] = "bytes"
            return response

    length = end - start + 1 if size else 0
    if request.method == "HEAD":
        response = HttpResponse(status=status)
    else:
        response = StreamingHttpResponse(file_chunks(full_path, start, length), status=status)
    response["Content-Type"] = content_type
    response["Content-Length"] = str(length)
    response["Accept-Ranges"] = "bytes"
    response["Last-Modified"] = http_date(os.path.getmtime(full_path))
    if status == 206:
        response["Content-Range"] = "bytes %d-%d/%d" % (start, end, size)
    return response
