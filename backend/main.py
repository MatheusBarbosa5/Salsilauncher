from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def setup():
    return {"backend": "fatapi"}