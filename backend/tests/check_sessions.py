"""Verifica a leitura de sessões sem abrir executáveis nem usar o banco real."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from datetime import datetime, timezone
from tempfile import TemporaryDirectory
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
import database
from main import app
from models.games import Game
from models.game_session import GameSession

with TemporaryDirectory() as directory:
    test_engine = create_engine(f'sqlite:///{directory}/test.db', connect_args={'check_same_thread': False})
    original_engine = database.engine
    database.engine = test_engine
    SQLModel.metadata.create_all(test_engine)
    try:
        with Session(test_engine) as db:
            game = Game(title='Test', exe_path='test.exe', folder_path='test')
            db.add(game)
            db.commit()
            db.refresh(game)
            gid = game.id
            row = GameSession(game_id=gid, pid=999, pid_criado_em=1.0, iniciada_em=datetime.now(timezone.utc), encerrada_em=datetime.now(timezone.utc), ativa=False, duracao_segundos=60)
            db.add(row)
            db.commit()
        with TestClient(app) as client:
            response = client.get(f'/games/{gid}/sessions')
            assert response.status_code == 200, response.text
            assert len(response.json()) == 1
            assert 'pid' not in response.json()[0]
            assert client.get('/games/999/sessions').status_code == 404
            assert client.get(f'/games/{gid}/sessions?offset=1').json() == []
        print('Leitura local de sessões: passou.')
    finally:
        database.engine = original_engine
        test_engine.dispose()
