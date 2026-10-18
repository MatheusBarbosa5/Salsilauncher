"""Verifica a cápsula gamer (estatísticas mensais/anuais) com banco temporário."""
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
from models.tags import Tag
from models.game_session import GameSession

def session_row(gid, start, seconds):
    return GameSession(game_id=gid, pid=1, pid_criado_em=1.0, iniciada_em=start, encerrada_em=start, ativa=False, duracao_segundos=seconds)

with TemporaryDirectory() as directory:
    test_engine = create_engine(f'sqlite:///{directory}/test.db', connect_args={'check_same_thread': False})
    original_engine = database.engine
    database.engine = test_engine
    SQLModel.metadata.create_all(test_engine)
    try:
        with Session(test_engine) as db:
            rpg, generic = Tag(name='RPG', slug='rpg'), Tag(name='PC Game', slug='pc-game')
            a = Game(title='A', exe_path='a.exe', folder_path='a', tags=[rpg, generic], vertical_cover='v.jpg')
            b = Game(title='B', exe_path='b.exe', folder_path='b', tags=[generic])
            db.add_all([a, b])
            db.commit()
            db.refresh(a)
            db.refresh(b)
            noon = lambda y, m, d: datetime(y, m, d, 12, 0, tzinfo=timezone.utc)
            db.add_all([
                session_row(a.id, noon(2025, 3, 10), 3600),
                session_row(a.id, noon(2025, 3, 11), 1800),
                session_row(b.id, noon(2025, 3, 12), 600),
                session_row(b.id, noon(2025, 7, 10), 7200),
                session_row(b.id, noon(2024, 5, 10), 100),
                GameSession(game_id=b.id, pid=1, pid_criado_em=1.0, iniciada_em=noon(2025, 3, 13), ativa=True),
            ])
            db.commit()
        with TestClient(app) as client:
            data = client.get('/stats/capsule?year=2025').json()
            assert 2024 in data['years_available'] and 2025 in data['years_available']
            march = data['months'][2]
            assert march['total_seconds'] == 6000 and march['sessions'] == 3
            assert march['top_games'][0]['title'] == 'A' and march['top_games'][0]['seconds'] == 5400
            assert march['top_games'][0]['cover'] == 'v.jpg'
            assert march['top_genres'] == [{'name': 'RPG', 'seconds': 5400}]
            assert data['months'][6]['top_games'][0]['title'] == 'B'
            assert data['months'][0]['total_seconds'] == 0 and data['months'][0]['top_games'] == []
            assert data['year_summary']['total_seconds'] == 13200
            assert [g['title'] for g in data['year_summary']['top_games']] == ['B', 'A']
            assert client.get('/stats/capsule?year=1900').status_code == 422
        print('Cápsula gamer: passou.')
    finally:
        database.engine = original_engine
        test_engine.dispose()
