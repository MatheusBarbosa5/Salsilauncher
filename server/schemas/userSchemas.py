from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

def _http_url(value):
    if value and not value.lower().startswith(("http://", "https://")):
        raise ValueError("avatar_url deve começar com http:// ou https://")
    return value

class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=512)
    language: str = Field(default="pt-BR", min_length=1, max_length=10)
    theme: str = Field(default="dark", min_length=1, max_length=20)

    _check_avatar = field_validator("avatar_url")(_http_url)

class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str | None = Field(default=None, min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=512)
    language: str | None = Field(default=None, min_length=1, max_length=10)
    theme: str | None = Field(default=None, min_length=1, max_length=20)

    _check_avatar = field_validator("avatar_url")(_http_url)

    @model_validator(mode="after")
    def nonnull(self):
        for key in self.model_fields_set & {"username", "email", "password", "language", "theme"}:
            if getattr(self, key) is None:
                raise ValueError(f"{key} não pode ser null")
        return self

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    display_name: str | None
    avatar_url: str | None
    is_active: bool
    is_banned: bool
    language: str
    theme: str
    last_login_at: datetime | None
    last_activity_at: datetime | None
    created_at: datetime
    updated_at: datetime

class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None

class LoginData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

UserResponse = UserRead
