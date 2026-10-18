import os
import sqlite3
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import jwt
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, select
import database
from main import app
from models import User, Game
from core.security import verify_password

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv('SECRET_KEY', 'test-secret-' * 6)
    monkeypatch.setenv('CATALOG_WRITE_KEY', 'test-catalog-key')
    engine = database.create_engine(f'sqlite:///{tmp_path / "api.db"}', connect_args={'check_same_thread': False})
    from sqlalchemy import event
    @event.listens_for(engine, 'connect')
    def foreign_keys(connection, _):
        connection.execute('PRAGMA foreign_keys=ON')
    SQLModel.metadata.create_all(engine)
    monkeypatch.setattr(database, 'engine', engine)
    with TestClient(app) as c:
        yield c
    engine.dispose()

def account(client, name):
    response = client.post('/auth/register', json={'username': name, 'email': name+'@example.com', 'password': 'test-password-123'})
    assert response.status_code == 201, response.text
    data = response.json()
    assert 'password_hash' not in data
    response = client.post('/auth/login', json={'email': name+'@example.com', 'password': 'test-password-123'})
    assert response.status_code == 200, response.text
    return data['id'], {'Authorization': 'Bearer '+response.json()['access_token']}

def game(client, auth):
    response = client.post('/games/', json={'name': 'Celeste', 'developer': 'Maddy Makes Games', 'cover_url': 'https://example.com/cover.jpg'}, headers=auth)
    assert response.status_code == 201, response.text
    assert response.json()['name'] == response.json()['title'] == 'Celeste'
    assert response.json()['cover_url'] == response.json()['cover']
    return response.json()['id']

def friendship(client, sender, receiver_id):
    response = client.post('/friendships/', json={'friend_id': receiver_id}, headers=sender)
    assert response.status_code == 201, response.text
    return response.json()['id']

def test_auth_and_password(client):
    uid, auth = account(client, 'renan')
    assert client.get('/auth/me', headers=auth).json()['id'] == uid
    assert client.get('/collections/').status_code == 401
    assert client.post('/auth/login', json={'email':'renan@example.com','password':'wrong'}).status_code == 401
    assert client.post('/auth/register', json={'username':'RENAN','email':'other@example.com','password':'test-password-123'}).status_code == 409
    with Session(database.engine) as db:
        stored=db.get(User,uid).password_hash
        assert stored.startswith('$argon2id$') and verify_password('test-password-123',stored)


def test_users_ownership_and_password_update(client):
    a, ah = account(client, 'renan')
    b, bh = account(client, 'maria')
    assert client.patch(f'/users/{a}', headers=bh, json={'theme':'light'}).status_code == 403
    response=client.patch(f'/users/{a}', headers=ah, json={'password':'new-pass-123','display_name':'Renan'})
    assert response.status_code == 200
    assert client.post('/auth/login',json={'email':'renan@example.com','password':'new-pass-123'}).status_code == 200
    profiles=client.get('/users/',headers=bh).json()
    assert all('email' not in p and 'password_hash' not in p for p in profiles)
    assert client.delete(f'/users/{a}',headers=ah).status_code == 204
    assert client.get('/auth/me',headers=ah).status_code == 401
    assert client.post('/auth/login',json={'email':'renan@example.com','password':'new-pass-123'}).status_code == 401


def test_token_validation(client):
    uid, auth=account(client,'renan')
    for sub, exp in [('oops',datetime.now(timezone.utc)+timedelta(hours=1)),(str(uid),datetime.now(timezone.utc)-timedelta(hours=1)),('9'*100,datetime.now(timezone.utc)+timedelta(hours=1))]:
        token=jwt.encode({'sub':sub,'iat':datetime.now(timezone.utc)-timedelta(hours=2),'exp':exp,'iss':'salsilauncher','aud':'launcher'},os.environ['SECRET_KEY'],algorithm='HS256')
        assert client.get('/auth/me',headers={'Authorization':'Bearer '+token}).status_code == 401
    with Session(database.engine) as db:
        u=db.get(User,uid)
        u.is_banned=True
        db.add(u)
        db.commit()
    assert client.get('/auth/me',headers=auth).status_code == 401


def test_friendship_transitions_and_blocks(client):
    a,ah=account(client,'renan')
    b,bh=account(client,'maria')
    c,ch=account(client,'carlos')
    assert client.post('/friendships/',headers=ah,json={'friend_id':a}).status_code == 422
    fid=friendship(client,ah,b)
    assert client.post('/friendships/',headers=bh,json={'friend_id':a}).status_code == 409
    assert client.get(f'/friendships/{fid}',headers=ch).status_code == 404
    assert client.patch(f'/friendships/{fid}',headers=ah,json={'status':'accepted'}).status_code == 403
    assert client.patch(f'/friendships/{fid}',headers=bh,json={'status':'accepted'}).json()['status']=='accepted'
    assert client.patch(f'/friendships/{fid}',headers=bh,json={'status':'rejected'}).status_code == 409
    assert client.patch(f'/friendships/{fid}',headers=ah,json={'status':'blocked'}).status_code == 200
    assert client.delete(f'/friendships/{fid}',headers=bh).status_code == 403
    assert client.post('/messages/',headers=bh,json={'receiver_id':a,'content':'hi'}).status_code == 403
    assert client.delete(f'/friendships/{fid}',headers=ah).status_code == 204


def test_messages_privacy_and_permissions(client):
    a,ah=account(client,'renan')
    b,bh=account(client,'maria')
    c,ch=account(client,'carlos')
    fid=friendship(client,ah,b)
    assert client.post('/messages/',headers=ah,json={'receiver_id':b,'content':'Oi'}).status_code == 403
    client.patch(f'/friendships/{fid}',headers=bh,json={'status':'accepted'})
    response=client.post('/messages/',headers=ah,json={'receiver_id':b,'content':'Oi'})
    assert response.status_code==201, response.text
    mid=response.json()['id']
    assert client.get('/messages/',headers=ch).json()==[]
    assert client.get(f'/messages/{mid}',headers=ch).status_code==404
    assert client.patch(f'/messages/{mid}',headers=bh,json={'content':'change'}).status_code==403
    assert client.patch(f'/messages/{mid}',headers=ah,json={'content':'Olá'}).status_code==200
    assert client.patch(f'/messages/{mid}/read',headers=ah).status_code==403
    first=client.patch(f'/messages/{mid}/read',headers=bh)
    assert first.status_code==200
    assert client.patch(f'/messages/{mid}/read',headers=bh).json()['read_at']==first.json()['read_at']
    assert client.patch(f'/messages/{mid}',headers=ah,json={'content':'change'}).status_code==409
    assert client.delete(f'/messages/{mid}',headers=bh).status_code==403
    assert client.delete(f'/messages/{mid}',headers=ah).status_code==204


def test_collections_relations_and_isolation(client):
    a,ah=account(client,'renan')
    b,bh=account(client,'maria')
    gid=game(client,ah)
    response=client.post('/collections/',headers=ah,json={'name':'Favoritos','game_ids':[gid,gid]})
    assert response.status_code==201, response.text
    cid=response.json()['id']
    assert response.json()['game_ids']==[gid]
    assert client.get('/collections/',headers=bh).json()==[]
    for method in ['get','patch','delete']:
        kwargs={'json':{'name':'bad'}} if method=='patch' else {}
        assert getattr(client,method)(f'/collections/{cid}',headers=bh,**kwargs).status_code==404
    assert client.patch(f'/collections/{cid}',headers=ah,json={'description':'Nova'}).json()['game_ids']==[gid]
    assert client.patch(f'/collections/{cid}',headers=ah,json={'game_ids':[9999]}).status_code==404
    assert len(client.get(f'/collections/{cid}/games',headers=ah).json())==1
    assert client.patch(f'/collections/{cid}',headers=ah,json={'name':None}).status_code==422
    assert client.delete(f'/collections/{cid}/games/{gid}',headers=ah).status_code==204
    assert client.get(f'/collections/{cid}',headers=ah).json()['game_ids']==[]
    assert client.post(f'/collections/{cid}/games/{gid}',headers=ah).status_code==200
    assert client.delete(f'/collections/{cid}',headers=ah).status_code==204
    assert client.post('/collections/',headers=ah,json={'name':'bad','user_id':b}).status_code==422


def test_ratings_unique_and_owned(client):
    a,ah=account(client,'renan')
    b,bh=account(client,'maria')
    gid=game(client,ah)
    response=client.post('/ratings/',headers=ah,json={'game_id':gid,'score':9,'review':'Muito bom'})
    assert response.status_code==201
    rid=response.json()['id']
    assert client.post('/ratings/',headers=ah,json={'game_id':gid,'score':9}).status_code==409
    assert client.post('/ratings/',headers=bh,json={'game_id':gid,'score':8}).status_code==201
    assert client.get(f'/ratings/{rid}',headers=bh).status_code==404
    assert client.patch(f'/ratings/{rid}',headers=bh,json={'score':1}).status_code==404
    assert client.patch(f'/ratings/{rid}',headers=ah,json={'review':None}).json()['score']==9
    assert client.patch(f'/ratings/{rid}',headers=ah,json={'score':11}).status_code==422
    assert client.delete(f'/ratings/{rid}',headers=ah).status_code==204


def test_play_sessions_duration_and_close(client):
    a,ah=account(client,'renan')
    b,bh=account(client,'maria')
    gid=game(client,ah)
    response=client.post('/play-sessions/',headers=ah,json={'game_id':gid,'started_at':'2026-10-12T18:00:00Z'})
    assert response.status_code==201, response.text
    sid=response.json()['id']
    assert response.json()['duration_seconds'] is None
    assert client.get('/play-sessions/',headers=bh).json()==[]
    assert client.patch(f'/play-sessions/{sid}/end',headers=bh,json={'ended_at':'2026-10-12T18:10:00Z'}).status_code==404
    assert client.patch(f'/play-sessions/{sid}/end',headers=ah,json={'ended_at':'2026-10-12T17:10:00Z'}).status_code==422
    response=client.patch(f'/play-sessions/{sid}/end',headers=ah,json={'ended_at':'2026-10-12T15:10:00-03:00'})
    assert response.status_code==200, response.text
    assert response.json()['duration_seconds']==600
    assert client.patch(f'/play-sessions/{sid}/end',headers=ah,json={'ended_at':'2026-10-12T18:10:00Z'}).status_code==200
    assert client.patch(f'/play-sessions/{sid}/end',headers=ah,json={'ended_at':'2026-10-12T18:11:00Z'}).status_code==409
    assert client.post('/play-sessions/',headers=ah,json={'game_id':gid,'started_at':'2026-10-12T18:00:00'}).status_code==422
    assert client.delete(f'/play-sessions/{sid}',headers=ah).status_code==204


def test_catalog_edit_restricted_and_metadata(client):
    _,ah=account(client,'renan')
    gid=game(client,ah)
    assert client.get('/games/').status_code==200
    assert client.put(f'/games/{gid}',headers=ah,json={'publisher':'Test'}).status_code==403
    response=client.put(f'/games/{gid}',headers={**ah,'X-Catalog-Key':'test-catalog-key'},json={'publisher':'Test','release_date':'2018-01-25'})
    assert response.status_code==200, response.text
    assert response.json()['publisher']=='Test'
    assert client.delete(f'/games/{gid}',headers={**ah,'X-Catalog-Key':'test-catalog-key'}).status_code==204
    assert client.get(f'/games/{gid}').status_code==404


def test_steam_search_does_not_persist_and_resolve(client,monkeypatch):
    from services import gameService
    async def search(query,limit=20):
        return [{'appid':504230,'name':'Celeste','header_image':'https://example.com/header.jpg'}]
    async def details(appid):
        return {'title':'Celeste','steam_appid':appid,'description':'Game','cover':'https://example.com/header.jpg'}
    monkeypatch.setattr(gameService,'search_steam_store',search)
    monkeypatch.setattr(gameService,'get_game_details',details)
    response=client.get('/games/search?q=Celeste')
    assert response.status_code==200, response.text
    assert client.get('/games/').json()==[]
    _,ah=account(client,'renan')
    first=client.post('/games/resolve',headers=ah,json={'steam_appid':504230})
    second=client.post('/games/resolve',headers=ah,json={'steam_appid':504230})
    assert first.status_code==201, first.text
    assert second.json()['id']==first.json()['id']
    assert len(client.get('/games/').json())==1


def test_fresh_and_legacy_migration(tmp_path):
    # O fixture legado é construído explicitamente, sem depender do ZIP na máquina do usuário.
    for legacy in (False,True):
        db=tmp_path/('legacy.db' if legacy else 'fresh.db')
        env={**os.environ,'DATABASE_URL':f'sqlite:///{db}'}
        if legacy:
            subprocess.run([sys.executable,'-m','alembic','upgrade','0001'],env=env,check=True,capture_output=True)
            connection=sqlite3.connect(db)
            connection.execute("INSERT INTO users (username,email,password_hash,is_active,is_banned,language,theme,created_at,updated_at) VALUES ('Legacy','LEGACY@example.com','legacy-password',1,0,'pt-BR','dark','2026-01-01','2026-01-01')")
            connection.execute("INSERT INTO game (title,steam_appid,description,cover,background,extra_images,genres,is_active) VALUES ('Legacy Game',123,'old','https://example.com/cover',NULL,NULL,NULL,1)")
            # Simula banco pré-Alembic.
            connection.execute('DROP TABLE alembic_version')
            connection.commit()
            connection.close()
        result=subprocess.run([sys.executable,'-m','alembic','upgrade','head'],env=env,capture_output=True,text=True)
        assert result.returncode==0,result.stderr
        connection=sqlite3.connect(db)
        names={r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert {'users','games','friendships','messages','collections','collection_games','ratings','play_sessions'}<=names
        if legacy:
            assert connection.execute('SELECT name FROM games').fetchone()[0]=='Legacy Game'
            hashed=connection.execute('SELECT password_hash FROM users').fetchone()[0]
            assert verify_password('legacy-password',hashed) and hashed.startswith('$argon2id$')
        connection.close()
        result=subprocess.run([sys.executable,'-m','alembic','check'],env=env,capture_output=True,text=True)
        assert result.returncode==0,result.stderr


def test_rejected_requests_and_invalid_foreign_keys(client):
    a, ah = account(client, 'renan')
    b, bh = account(client, 'maria')
    fid = friendship(client, ah, b)
    assert client.patch(f'/friendships/{fid}', headers=bh, json={'status':'rejected'}).json()['status'] == 'rejected'
    assert client.post('/messages/', headers=ah, json={'receiver_id':b,'content':'hi'}).status_code == 403
    assert client.post('/ratings/', headers=ah, json={'game_id':9999,'score':8}).status_code == 404
    assert client.post('/play-sessions/', headers=ah, json={'game_id':9999,'started_at':'2026-10-12T18:00:00Z'}).status_code == 404
    assert client.post('/friendships/', headers=ah, json={'friend_id':9999}).status_code == 404
    assert client.post('/messages/', headers=ah, json={'receiver_id':b,'sender_id':b,'content':'hi'}).status_code == 422
    assert client.patch(f'/users/{a}', headers=ah, json={'is_banned':False}).status_code == 422


def test_session_sync_idempotent_per_account(client):
    from uuid import uuid4
    a, ah = account(client, 'renan')
    b, bh = account(client, 'maria')
    gid = game(client, ah)
    payload = {'game_id': gid, 'started_at': '2026-10-12T18:00:00Z', 'ended_at': '2026-10-12T18:10:00Z', 'client_session_id': str(uuid4())}
    first = client.post('/play-sessions/', headers=ah, json=payload)
    second = client.post('/play-sessions/', headers=ah, json=payload)
    assert first.status_code == 201 and second.status_code == 201
    assert first.json()['id'] == second.json()['id']
    assert len(client.get('/play-sessions/', headers=ah).json()) == 1
    assert client.post('/play-sessions/', headers=ah, json={**payload, 'ended_at': '2026-10-12T18:11:00Z'}).status_code == 409
    assert client.post('/play-sessions/', headers=bh, json=payload).status_code == 201


def test_groups_membership_and_messages(client):
    a, ah = account(client, 'renan')
    b, bh = account(client, 'maria')
    c, ch = account(client, 'carlos')
    fid = friendship(client, ah, b)
    client.patch(f'/friendships/{fid}', headers=bh, json={'status': 'accepted'})
    assert client.post('/groups/', headers=ah, json={'name': 'G', 'member_ids': [c]}).status_code == 403
    created = client.post('/groups/', headers=ah, json={'name': ' Squad ', 'member_ids': [b]})
    assert created.status_code == 201, created.text
    group = created.json()
    gid = group['id']
    assert group['name'] == 'Squad' and sorted(group['member_ids']) == sorted([a, b])
    assert client.get(f'/groups/{gid}', headers=ch).status_code == 404
    assert client.post(f'/groups/{gid}/messages', headers=ch, json={'content': 'oi'}).status_code == 404
    sent = client.post(f'/groups/{gid}/messages', headers=bh, json={'content': 'Olá'})
    assert sent.status_code == 201, sent.text
    assert len(client.get(f'/groups/{gid}/messages', headers=ah).json()) == 1
    assert client.post(f'/groups/{gid}/members', headers=bh, json={'user_id': c}).status_code == 403
    assert client.post(f'/groups/{gid}/members', headers=ah, json={'user_id': c}).status_code == 403
    assert client.delete(f'/groups/{gid}/members/{a}', headers=bh).status_code == 403
    assert client.delete(f'/groups/{gid}/members/{a}', headers=ah).status_code == 409
    assert client.delete(f'/groups/{gid}/members/{b}', headers=bh).status_code == 204
    assert client.get(f'/groups/{gid}', headers=bh).status_code == 404
    assert client.delete(f'/groups/{gid}', headers=bh).status_code == 404
    assert client.delete(f'/groups/{gid}', headers=ah).status_code == 204
    assert client.get('/groups/', headers=ah).json() == []


def test_avatar_upload_and_url_validation(client, tmp_path, monkeypatch):
    from routers import userRouters
    monkeypatch.setattr(userRouters, 'AVATAR_DIR', tmp_path / 'avatars')
    a, ah = account(client, 'renan')
    assert client.patch(f'/users/{a}', headers=ah, json={'avatar_url': 'javascript:alert(1)'}).status_code == 422
    assert client.patch(f'/users/{a}', headers=ah, json={'avatar_url': 'https://example.com/a.png'}).status_code == 200
    png = b'\x89PNG\r\n\x1a\n' + b'0' * 32
    bad = client.post('/users/me/avatar', headers=ah, files={'file': ('x.svg', b'<svg onload=alert(1)>', 'image/svg+xml')})
    assert bad.status_code == 415
    big = client.post('/users/me/avatar', headers=ah, files={'file': ('x.png', png + b'0' * (2 * 1024 * 1024), 'image/png')})
    assert big.status_code == 413
    ok = client.post('/users/me/avatar', headers=ah, files={'file': ('x.png', png, 'image/png')})
    assert ok.status_code == 200, ok.text
    url = ok.json()['avatar_url']
    assert '/uploads/avatars/' in url and url.endswith('.png')
    assert len(list((tmp_path / 'avatars').iterdir())) == 1
