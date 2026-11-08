import base64
from io import BytesIO
import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter
from pypdf.generic import (
    DecodedStreamObject,
    DictionaryObject,
    NameObject,
    NumberObject,
)


def make_text_pdf() -> bytes:
    """Build a small selectable-text PDF fixture without external services."""
    writer = PdfWriter()
    page = writer.add_blank_page(width=240, height=120)
    font = DictionaryObject({
        NameObject("/Type"): NameObject("/Font"),
        NameObject("/Subtype"): NameObject("/Type1"),
        NameObject("/BaseFont"): NameObject("/Helvetica"),
    })
    font_ref = writer._add_object(font)
    page[NameObject("/Resources")] = DictionaryObject({
        NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_ref}),
    })
    stream = DecodedStreamObject()
    stream.set_data(b"BT /F1 12 Tf 12 60 Td (The answer in this document is oak.) Tj ET")
    page[NameObject("/Contents")] = writer._add_object(stream)
    page[NameObject("/MediaBox")][2] = NumberObject(240)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def test_valid_file_upload(client: TestClient):
    """Test valid text and markdown document uploads."""
    payload = {
        "fileName": "guide.md",
        "fileContent": "# Getting Started\nThis is a clean markdown document for testing.",
        "fileType": "text/markdown",
    }
    response = client.post("/api/upload", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["fileName"] == "guide.md"
    assert data["extractedLength"] > 0
    assert "Getting Started" in data["content"]


@pytest.mark.parametrize(
    "extension,content",
    [
        ("txt", "plain text"),
        ("md", "# Markdown"),
        ("json", '{"ok": true}'),
        ("csv", "name,value\\nalpha,1"),
        ("js", "const answer = 42;"),
        ("ts", "const answer: number = 42;"),
        ("py", "answer = 42"),
        ("html", "<p>Readable source</p>"),
        ("css", "body { color: black; }"),
    ],
)
def test_supported_text_formats(client: TestClient, extension: str, content: str):
    response = client.post(
        "/api/upload",
        json={"fileName": f"sample.{extension}", "fileContent": content},
    )
    assert response.status_code == 200
    assert response.json()["content"] == content


def test_pdf_upload_extracts_actual_text(client: TestClient):
    pdf_b64 = base64.b64encode(make_text_pdf()).decode("ascii")
    response = client.post(
        "/api/upload",
        json={
            "fileName": "guide.pdf",
            "fileContent": f"data:application/pdf;base64,{pdf_b64}",
            "fileType": "application/pdf",
        },
    )
    assert response.status_code == 200
    assert "answer in this document is oak" in response.json()["content"]


def test_file_size_limit_rejection(client: TestClient):
    """Test that payloads exceeding the 2MB limit are rejected with 413."""
    oversized_content = "A" * 3_500_000
    payload = {
        "fileName": "oversized.txt",
        "fileContent": oversized_content,
    }
    response = client.post("/api/upload", json=payload)
    assert response.status_code == 413
    assert "exceeds" in response.json()["error"].lower()


def test_unsupported_file_extension_rejection(client: TestClient):
    """Test that executable or disallowed extensions are rejected with 400."""
    payload = {
        "fileName": "malicious.exe",
        "fileContent": "MZ9000BINARYCONTENT",
    }
    response = client.post("/api/upload", json=payload)
    assert response.status_code == 400
    assert "not supported" in response.json()["error"]


def test_path_traversal_sanitization(client: TestClient):
    """Test that directory traversal sequences in filename are sanitized."""
    payload = {
        "fileName": "../../etc/passwd",
        "fileContent": "root:x:0:0:root:/root:/bin/bash",
    }
    response = client.post("/api/upload", json=payload)
    # The file has no allowed extension or is sanitized safely
    assert response.status_code in (200, 400)
    if response.status_code == 200:
        assert "/" not in response.json()["fileName"]
        assert ".." not in response.json()["fileName"]


def test_malformed_pdf_and_empty_upload_are_rejected(client: TestClient):
    malformed = client.post(
        "/api/upload",
        json={"fileName": "broken.pdf", "fileContent": "data:application/pdf;base64,not-valid!"},
    )
    assert malformed.status_code == 400
    assert "malformed" in malformed.json()["error"].lower()

    empty = client.post(
        "/api/upload",
        json={"fileName": "empty.md", "fileContent": ""},
    )
    assert empty.status_code == 400

