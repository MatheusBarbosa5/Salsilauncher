from datetime import datetime, timedelta, timezone
from uuid import uuid4
import jwt
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, select
from app.config import Settings
from app.database import make_engine
from app.main import create_app
from app.models.entities import User, Game

@pytest.fixture()
def client(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path / 'test.db'}")
    SQLModel.metadata.create_all(engine)
    settings = Settings(str(engine.url), "test-secret-" * 6, 60, ["http://localhost:5173"])
    with TestClient(create_app(settings, engine)) as c:
        yield c

def account(client, name):
    data = {"username": name, "email": f"{name}@example.com", "password": "strong-pass-123"}
    response = client.post('/auth/register', json=data)
    assert response.status_code == 201, response.text
    assert 'password_hash' not in response.json()
    response = client.post('/auth/login', json={k: data[k] for k in ('email', 'password')})
    assert response.status_code == 200
    return {"Authorization": "Bearer " + response.json()['access_token']}

def game(client, auth, **extra):
    response = client.post('/games/', json={"title": "Celeste", **extra}, headers=auth)
    assert response.status_code == 201, response.text
    return response.json()

def test_register_login_me(client):
    auth = account(client, 'renan')
    assert client.get('/auth/me', headers=auth).json()['username'] == 'renan'
    assert client.post('/auth/login', json={"email": "renan@example.com", "password": "wrong"}).status_code == 401
    assert client.post('/auth/login', json={"email": "absent@example.com", "password": "wrong"}).status_code == 401
    with Session(client.app.state.engine) as session:
        user = session.exec(select(User)).one()
        assert user.password_hash.startswith('$argon2id$')
        assert user.password_hash != 'strong-pass-123'

def test_duplicate_and_validation(client):
    account(client, 'renan')
    assert client.post('/auth/register', json={"username": "RENAN", "email": "other@example.com", "password": "strong-pass-123"}).status_code == 409
    assert client.post('/auth/register', json={"username": "other", "email": "RENAN@example.com", "password": "strong-pass-123"}).status_code == 409
    assert client.post('/auth/register', json={"username": "x", "email": "bad", "password": "123"}).status_code == 422

def test_missing_expired_malformed_tokens(client):
    auth = account(client, 'renan')
    assert client.get('/games/').status_code == 401
    assert client.get('/auth/me', headers={"Authorization": "Bearer junk"}).status_code == 401
    settings = client.app.state.settings
    for sub, exp in [('abc', datetime.now(timezone.utc) + timedelta(hours=1)), ('1', datetime.now(timezone.utc) - timedelta(hours=1)), ('9' * 100, datetime.now(timezone.utc) + timedelta(hours=1))]:
        token = jwt.encode({"sub": sub, "exp": exp, "iat": datetime.now(timezone.utc) - timedelta(hours=2), "iss": "salsilauncher", "aud": "salsilauncher-launcher"}, settings.secret_key, algorithm='HS256')
        assert client.get('/auth/me', headers={"Authorization": f"Bearer {token}"}).status_code == 401

def test_disabled_user(client):
    auth = account(client, 'renan')
    with Session(client.app.state.engine) as session:
        user = session.exec(select(User)).one()
        user.is_banned = True
        session.add(user)
        session.commit()
    assert client.get('/auth/me', headers=auth).status_code == 401

def test_game_isolation_and_steam_uniqueness(client):
    a, b = account(client, 'renan'), account(client, 'maria')
    g = game(client, a, steam_appid=504230)
    assert client.get('/games/', headers=b).json() == []
    for method in ['get', 'delete', 'put', 'patch']:
        kwargs = {"json": {"favorite": True}} if method in ['put', 'patch'] else {}
        assert getattr(client, method)(f"/games/{g['id']}", headers=b, **kwargs).status_code == 404
    game(client, b, steam_appid=504230)
    assert client.post('/games/', json={"title": "duplicate", "steam_appid": 504230}, headers=a).status_code == 409
    response = client.patch(f"/games/{g['id']}", json={"favorite": True, "description": None}, headers=a)
    assert response.json()['favorite'] is True
    assert client.patch(f"/games/{g['id']}", json={"title": None}, headers=a).status_code == 422
    assert client.post('/games/', json={"title": "bad", "owner_id": 2}, headers=a).status_code == 422
    assert client.post('/games/', json={"title": "bad", "exe_path": "C:/Games/x.exe"}, headers=a).status_code == 422

def test_tags_isolation(client):
    a, b = account(client, 'renan'), account(client, 'maria')
    tag = client.post('/tags/?name=RPG', headers=a).json()
    assert client.post('/tags/?name=rpg', headers=a).json()['id'] == tag['id']
    assert client.get('/tags/', headers=b).json() == []
    assert client.post('/games/', headers=b, json={"title": "bad", "tag_ids": [tag['id']]}).status_code == 404
    g = game(client, a, tag_ids=[tag['id'], tag['id']])
    assert len(g['tags']) == 1

def test_collections_isolation_and_partial_update(client):
    a, b = account(client, 'renan'), account(client, 'maria')
    ga, gb = game(client, a), game(client, b)
    ca = client.post('/collections/', json={"title": "Favoritos", "game_ids": [ga['id']]}, headers=a).json()
    cid = ca['id']
    assert client.get('/collections/', headers=b).json() == []
    assert client.get(f'/collections/{cid}', headers=b).status_code == 404
    assert client.patch(f'/collections/{cid}', json={"title": "Novo"}, headers=a).status_code == 200
    assert len(client.get(f'/collections/{cid}', headers=a).json()) == 1
    assert client.patch(f'/collections/{cid}', json={"game_ids": [gb['id']]}, headers=a).status_code == 404
    assert client.post(f'/collections/{cid}/games/{gb["id"]}', headers=a).status_code == 404
    assert client.delete(f'/collections/{cid}', headers=b).status_code == 404
    assert client.delete(f'/games/{ga["id"]}', headers=a).status_code == 204
    assert client.get(f'/collections/{cid}', headers=a).json() == []

def test_sessions_idempotency_and_isolation(client):
    a, b = account(client, 'renan'), account(client, 'maria')
    g = game(client, a)
    data = {"game_id": g['id'], "client_session_id": str(uuid4()), "iniciada_em": "2026-09-30T10:00:00Z", "encerrada_em": "2026-09-30T10:02:00Z"}
    assert client.post('/sessions/', json=data, headers=b).status_code == 404
    first = client.post('/sessions/', json=data, headers=a)
    assert first.status_code == 200, first.text
    second = client.post('/sessions/', json=data, headers=a)
    assert first.json()['id'] == second.json()['id']
    assert client.get(f'/games/{g["id"]}', headers=a).json()['play_time'] == 120
    assert client.get('/sessions/', headers=b).json() == []
    assert client.post('/sessions/', json={**data, "encerrada_em": "2026-09-30T10:03:00Z"}, headers=a).status_code == 409
    assert client.post('/sessions/', json={**data, "iniciada_em": "2026-09-30T10:00:00"}, headers=a).status_code == 422
    assert client.post('/sessions/', json={**data, "encerrada_em": "2026-09-30T09:00:00Z"}, headers=a).status_code == 422
    assert client.patch(f'/games/{g["id"]}', json={"play_time": 999}, headers=a).status_code == 422

def test_ratings_and_cleanup(client):
    a, b = account(client, 'renan'), account(client, 'maria')
    g = game(client, a)
    body = {"game_id": g['id'], "stars": 4.5, "gameplay": 9}
    assert client.put(f'/ratings/{g["id"]}', json=body, headers=b).status_code == 404
    assert client.put(f'/ratings/{g["id"]}', json=body, headers=a).status_code == 200
    assert client.put(f'/ratings/{g["id"]}', json={**body, "stars": 8}, headers=a).status_code == 422
    assert client.get('/ratings/', headers=b).json() == []
    assert client.delete(f'/games/{g["id"]}', headers=a).status_code == 204
    assert client.get('/ratings/', headers=a).json() == []

def test_remote_has_no_computer_operations(client):
    paths = client.get('/openapi.json').json()['paths']
    assert not any(x in path for path in paths for x in ('browse', 'scan', 'abrir', 'upload-cover'))

def test_cors_and_health(client):
    assert client.get('/health').json() == {"status": "ok"}
    for origin, allowed in [('http://localhost:5173', True), ('https://other.example.com', False)]:
        response = client.options('/games/', headers={"Origin": origin, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization"})
        assert ('access-control-allow-origin' in response.headers) is allowed

def test_steam_mock_and_failure(client, monkeypatch):
    from app.service import steam
    auth = account(client, 'renan')
    async def details(appid):
        return {"steam_appid": appid, "title": "Celeste"}
    monkeypatch.setattr(steam, 'get_game_details', details)
    assert client.get('/steam/games/504230', headers=auth).json()['title'] == 'Celeste'
    async def failure(appid):
        import httpx
        raise httpx.ReadTimeout('timeout')
    monkeypatch.setattr(steam, 'get_game_details', failure)
    assert client.get('/steam/games/504230', headers=auth).status_code == 502
