import argparse
import asyncio
from pathlib import Path

from gnani import tts_with_retry

TEXTS = [
    "He said no processing fee. The document says two percent.",
    "He said you can close anytime. The document says four percent prepayment penalty.",
    "He said twelve percent interest. This matches the document.",
]

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--language", default="en-IN")
    parser.add_argument("--voice", default="Nalini")
    args = parser.parse_args()
    output = Path(__file__).resolve().parents[1] / "clips"
    output.mkdir(exist_ok=True)
    for index, text in enumerate(TEXTS, 1):
        (output / f"whisper_{index}.wav").write_bytes(await tts_with_retry(text, args.language, args.voice))
        print(f"Generated whisper_{index}.wav")

if __name__ == "__main__": asyncio.run(main())
