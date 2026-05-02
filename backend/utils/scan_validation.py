from pathlib import Path
import os
from fastapi import HTTPException


def validar_scan_path(path: Path):
    if not path.exists():
        raise HTTPException(
            status_code=400,
            detail="O caminho informado não existe."
        )

    if not path.is_dir():
        raise HTTPException(
            status_code=400,
            detail="O caminho informado não é um diretório."
        )

    if not os.access(path, os.R_OK):
        raise HTTPException(
            status_code=400,
            detail="Sem permissão de leitura para o diretório."
        )
